// src/components/WeekPlanning.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { subscribeToWeekPlanning, setDayRecipe, subscribeToRecipes } from '../firebase'
import { getWeekId, getWeekDays, getWeekDates, getPrevWeekId, getNextWeekId } from '../weekUtils'
import DayPicker from './DayPicker'

const DAY_SHORT = { maandag: 'Ma', dinsdag: 'Di', woensdag: 'Wo', donderdag: 'Do', vrijdag: 'Vr', zaterdag: 'Za', zondag: 'Zo' }
const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

function formatDate(date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export default function WeekPlanning() {
  const [weekId, setWeekId] = useState(() => getWeekId())
  const [planning, setPlanning] = useState({ days: {} })
  const [recipes, setRecipes] = useState([])
  const [pickerDay, setPickerDay] = useState(null)
  const navigate = useNavigate()

  useEffect(() => subscribeToWeekPlanning(weekId, setPlanning), [weekId])
  useEffect(() => subscribeToRecipes(setRecipes), [])

  const days = getWeekDays()
  const weekDates = getWeekDates(weekId)
  const today = new Date()
  const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]))

  const getEffectiveDay = (dayIndex) => {
    const day = days[dayIndex]
    const dayData = planning.days[day] || { recipeId: null, spans2Days: false }
    if (!dayData.recipeId && dayIndex > 0) {
      const prevDay = days[dayIndex - 1]
      const prevData = planning.days[prevDay] || {}
      if (prevData.spans2Days && prevData.recipeId) {
        return { recipeId: prevData.recipeId, isSecondDay: true }
      }
    }
    return { recipeId: dayData.recipeId, isSecondDay: false, spans2Days: dayData.spans2Days }
  }

  const handleSelect = async (recipeId, spans2Days) => {
    await setDayRecipe(weekId, pickerDay, recipeId, spans2Days)
    setPickerDay(null)
  }

  const recipesInWeek = [...new Set(
    days.map((d, i) => getEffectiveDay(i).recipeId).filter(Boolean)
  )].map(id => recipeMap[id]).filter(Boolean)

  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]
  const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${weekStart.getDate()}–${formatDate(weekEnd)}`
    : `${formatDate(weekStart)} – ${formatDate(weekEnd)}`

  return (
    <div>
      <div className="topbar">
        <button className="topbar-back" onClick={() => setWeekId(getPrevWeekId(weekId))}>◀</button>
        <div style={{ textAlign: 'center' }}>
          <div>Week {weekId.split('-')[1]}</div>
          <div style={{ fontSize: '12px', fontWeight: 400, opacity: 0.85 }}>{weekLabel}</div>
        </div>
        <button className="topbar-back" onClick={() => setWeekId(getNextWeekId(weekId))}>▶</button>
      </div>

      <div>
        {days.map((day, i) => {
          const { recipeId, isSecondDay, spans2Days } = getEffectiveDay(i)
          const recipe = recipeId ? recipeMap[recipeId] : null
          const isToday = isSameDay(weekDates[i], today)
          return (
            <div key={day} className={`day-row${isToday ? ' day-row-today' : ''}`} onClick={() => !isSecondDay && setPickerDay(day)}>
              <div className="day-label">
                <span className="day-short">{DAY_SHORT[day]}</span>
                <span className="day-date">{weekDates[i].getDate()}/{weekDates[i].getMonth() + 1}</span>
              </div>
              {recipe ? (
                <div className={`day-recipe ${isSecondDay ? 'second-day' : ''}`}>
                  <span>{recipe.title}</span>
                  {isSecondDay && <span className="day-badge">2e dag</span>}
                  {spans2Days && !isSecondDay && <span className="day-badge">→2</span>}
                </div>
              ) : (
                <div className="day-empty">+ Recept kiezen</div>
              )}
            </div>
          )
        })}
      </div>

      {recipesInWeek.length > 0 && (
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
