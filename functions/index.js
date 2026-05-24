// functions/index.js
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
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

exports.generateRecipeImage = onDocumentCreated(
  { document: 'recipes/{recipeId}', region: 'europe-west4', timeoutSeconds: 120 },
  async (event) => {
    const recipeId = event.params.recipeId
    const recipe = event.data.data()
    const db = getFirestore()
    const bucket = getStorage().bucket()

    const prompt = `Food photography of ${recipe.title}, ${recipe.description || 'delicious home-cooked meal'}, appetizing, professional, natural lighting`

    try {
      const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}`
      const [response] = await predictionClient.predict({
        endpoint,
        instances: [helpers.toValue({ prompt })],
        parameters: helpers.toValue({ sampleCount: 1, aspectRatio: '1:1' }),
      })

      const prediction = helpers.fromValue(response.predictions[0])
      const base64Image = prediction.bytesBase64Encoded
      const imageBuffer = Buffer.from(base64Image, 'base64')

      const filePath = `recipe-images/${recipeId}.jpg`
      const file = bucket.file(filePath)
      await file.save(imageBuffer, { contentType: 'image/jpeg', public: true })

      const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`

      await db.collection('recipes').doc(recipeId).update({
        imageUrl,
        imageStatus: 'done',
      })
    } catch (err) {
      console.error('Vertex AI fout:', err.message)
      await db.collection('recipes').doc(recipeId).update({
        imageStatus: 'error',
      })
    }
  }
)
