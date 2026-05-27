// src/components/WeekPlanning.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { subscribeToWeekPlanning, setDayRecipe, moveDayRecipe, subscribeToRecipes } from '../firebase'
import { getWeekId, getWeekDates, getPrevWeekId, getNextWeekId } from '../weekUtils'
import DayPicker from './DayPicker'

const DAYS = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']
const DAY_SHORT = { maandag: 'Ma', dinsdag: 'Di', woensdag: 'Wo', donderdag: 'Do', vrijdag: 'Vr', zaterdag: 'Za', zondag: 'Zo' }
const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

function formatDate(d) { return `${d.getDate()} ${MONTHS[d.getMonth()]}` }
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function WeekPlanning() {
  const [weekId, setWeekId] = useState(() => getWeekId())
  const [planning, setPlanning] = useState({ days: {} })
  const [recipes, setRecipes] = useState([])
  const [pickerDay, setPickerDay] = useState(null)
  const [dragging, setDragging] = useState(null)   // { day, recipeId, spans2Days, title }
  const [dragOver, setDragOver] = useState(null)   // target day name
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 })

  // Refs to access current drag state inside document-level event handlers
  const draggingRef = useRef(null)
  const dragOverRef = useRef(null)
  const weekIdRef = useRef(weekId)
  const dayRowRefs = useRef({})

  useEffect(() => { weekIdRef.current = weekId }, [weekId])
  useEffect(() => subscribeToWeekPlanning(weekId, setPlanning), [weekId])
  useEffect(() => subscribeToRecipes(setRecipes), [])

  const weekDates = getWeekDates(weekId)
  const today = new Date()
  const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]))

  const getEffectiveDay = (i) => {
    const day = DAYS[i]
    const data = planning.days[day] || {}
    if (!data.recipeId && i > 0) {
      const prev = planning.days[DAYS[i - 1]] || {}
      if (prev.spans2Days && prev.recipeId) return { recipeId: prev.recipeId, isSecondDay: true }
    }
    return { recipeId: data.recipeId || null, isSecondDay: false, spans2Days: data.spans2Days || false }
  }

  const getDayAtPoint = useCallback((x, y) => {
    for (const day of DAYS) {
      const el = dayRowRefs.current[day]
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (y >= r.top && y <= r.bottom) return day
    }
    return null
  }, [])

  const startDrag = useCallback((day, recipeId, spans2Days, title, cx, cy) => {
    draggingRef.current = { day, recipeId, spans2Days, title }
    dragOverRef.current = null
    setDragging({ day, recipeId, spans2Days, title })
    setGhostPos({ x: cx, y: cy })
    setDragOver(null)

    const onMove = (e) => {
      e.preventDefault()
      const pt = e.touches ? e.touches[0] : e
      setGhostPos({ x: pt.clientX, y: pt.clientY })
      const hit = getDayAtPoint(pt.clientX, pt.clientY)
      const over = hit && hit !== draggingRef.current?.day ? hit : null
      dragOverRef.current = over
      setDragOver(over)
    }

    const onEnd = async () => {
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onEnd)

      const d = draggingRef.current
      const over = dragOverRef.current
      if (d && over) {
        await moveDayRecipe(weekIdRef.current, d.day, over, d.recipeId, d.spans2Days)
      }
      draggingRef.current = null
      dragOverRef.current = null
      setDragging(null)
      setDragOver(null)
    }

    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onEnd)
  }, [getDayAtPoint])

  const handleSelect = async (recipeId, spans2Days) => {
    await setDayRecipe(weekId, pickerDay, recipeId, spans2Days)
    setPickerDay(null)
  }

  const recipesInWeek = [...new Set(
    DAYS.map((_, i) => getEffectiveDay(i).recipeId).filter(Boolean)
  )].map(id => recipeMap[id]).filter(Boolean)

  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]
  const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${weekStart.getDate()}–${formatDate(weekEnd)}`
    : `${formatDate(weekStart)} – ${formatDate(weekEnd)}`

  return (
    <div style={{ userSelect: 'none' }}>
      <div className="topbar">
        <button className="topbar-back" onClick={() => setWeekId(getPrevWeekId(weekId))}>◀</button>
        <div style={{ textAlign: 'center' }}>
          <div>Week {weekId.split('-')[1]}</div>
          <div style={{ fontSize: '12px', fontWeight: 400, opacity: 0.85 }}>{weekLabel}</div>
        </div>
        <button className="topbar-back" onClick={() => setWeekId(getNextWeekId(weekId))}>▶</button>
      </div>

      <div>
        {DAYS.map((day, i) => {
          const { recipeId, isSecondDay, spans2Days } = getEffectiveDay(i)
          const recipe = recipeId ? recipeMap[recipeId] : null
          const isToday = isSameDay(weekDates[i], today)
          const isDragSource = dragging?.day === day
          const isDragOver = dragOver === day

          const rowClass = [
            'day-row',
            isToday && !dragging ? 'day-row-today' : '',
            isDragSource ? 'day-row-dragging' : '',
            isDragOver ? 'day-row-drag-over' : '',
          ].filter(Boolean).join(' ')

          return (
            <div
              key={day}
              className={rowClass}
              ref={el => { dayRowRefs.current[day] = el }}
              onClick={() => !dragging && !isSecondDay && setPickerDay(day)}
            >
              <div className="day-label">
                <span className="day-short">{DAY_SHORT[day]}</span>
                <span className="day-date">{weekDates[i].getDate()}/{weekDates[i].getMonth() + 1}</span>
              </div>

              {recipe ? (
                <div className={`day-recipe${isSecondDay ? ' second-day' : ''}`}>
                  <span>{recipe.title}</span>
                  {isSecondDay && <span className="day-badge">2e dag</span>}
                  {spans2Days && !isSecondDay && <span className="day-badge">→2</span>}
                </div>
              ) : (
                <div className={`day-empty${isDragOver ? ' day-empty-over' : ''}`}>
                  {isDragOver ? '↓ Hier neerzetten' : '+ Recept kiezen'}
                </div>
              )}

              {recipe && !isSecondDay && (
                <div
                  className="day-drag-handle"
                  onMouseDown={e => { e.stopPropagation(); startDrag(day, recipeId, spans2Days, recipe.title, e.clientX, e.clientY) }}
                  onTouchStart={e => { e.stopPropagation(); e.preventDefault(); startDrag(day, recipeId, spans2Days, recipe.title, e.touches[0].clientX, e.touches[0].clientY) }}
                >
                  ⠿
                </div>
              )}
            </div>
          )
        })}
      </div>

      {dragging && (
        <div className="drag-ghost" style={{ left: ghostPos.x, top: ghostPos.y }}>
          {dragging.title}
        </div>
      )}

      {recipesInWeek.length > 0 && !dragging && (
        <div style={{ padding: '16px' }}>
          <button className="btn-primary" onClick={() => navigate('/boodschappen')}>
            🛒 Naar boodschappenlijst ({recipesInWeek.length} recepten)
          </button>
        </div>
      )}

      {pickerDay && (
        <DayPicker
          dayName={pickerDay}
          currentRecipeId={planning.days[pickerDay]?.recipeId}
          onSelect={handleSelect}
          onClose={() => setPickerDay(null)}
        />
      )}
    </div>
  )
}
