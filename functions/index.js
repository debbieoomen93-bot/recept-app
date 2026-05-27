// functions/index.js
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getStorage } = require('firebase-admin/storage')
const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1
const { helpers } = require('@google-cloud/aiplatform')

initializeApp()

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT
const LOCATION = 'us-central1'
const MODEL = 'imagegeneration@006'

const predictionClient = new PredictionServiceClient({
  apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
})

async function generateAndStoreImage(recipeId, recipe) {
  const db = getFirestore()
  const bucket = getStorage().bucket()
  const prompt = `Food photography of ${recipe.title}, ${recipe.description || 'delicious home-cooked meal'}, appetizing, professional, natural lighting`
  const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}`
  const [response] = await predictionClient.predict({
    endpoint,
    instances: [helpers.toValue({ prompt })],
    parameters: helpers.toValue({ sampleCount: 1, aspectRatio: '1:1' }),
  })
  if (!response.predictions?.length) throw new Error('Geen afbeelding ontvangen van Vertex AI')
  const base64Image = helpers.fromValue(response.predictions[0]).bytesBase64Encoded
  const filePath = `recipe-images/${recipeId}.jpg`
  await bucket.file(filePath).save(Buffer.from(base64Image, 'base64'), { contentType: 'image/jpeg', public: true })
  const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`
  await db.collection('recipes').doc(recipeId).update({ imageUrl, imageStatus: 'done' })
}

exports.generateRecipeImage = onDocumentCreated(
  { document: 'recipes/{recipeId}', region: 'europe-west4', timeoutSeconds: 120 },
  async (event) => {
    const recipeId = event.params.recipeId
    try {
      await generateAndStoreImage(recipeId, event.data.data())
    } catch (err) {
      console.error('Vertex AI fout:', err.message)
      await getFirestore().collection('recipes').doc(recipeId).update({ imageStatus: 'error' })
    }
  }
)

exports.regenerateRecipeImage = onDocumentUpdated(
  { document: 'recipes/{recipeId}', region: 'europe-west4', timeoutSeconds: 120 },
  async (event) => {
    const before = event.data.before.data()
    const after = event.data.after.data()
    if (before.imageStatus === 'pending' || after.imageStatus !== 'pending') return
    const recipeId = event.params.recipeId
    try {
      await generateAndStoreImage(recipeId, after)
    } catch (err) {
      console.error('Vertex AI fout bij regenereren:', err.message)
      await getFirestore().collection('recipes').doc(recipeId).update({ imageStatus: 'error' })
    }
  }
)
