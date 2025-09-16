import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

// Replicate API configuration
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || ''
const MODEL_PATH = 'fermatresearch/magic-image-refiner:507ddf6f977a7e30e46c0daefd30de7d563c72322f9e4cf7cbac52ef0f667b13'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Test endpoint: Testing Replicate API connection')
    
    if (!REPLICATE_API_TOKEN) {
      console.error('❌ Test: Replicate API token not configured')
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      )
    }

    console.log('✅ Test: API token found, initializing Replicate client')

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: REPLICATE_API_TOKEN,
    })

    console.log('✅ Test: Replicate client initialized')

    // Test with a simple prediction to see if the API works
    console.log('🧪 Test: Testing with a simple image enhancement')
    
    const testInput = {
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      prompt: 'test enhancement',
      negative_prompt: 'blurry, low quality',
      steps: 5, // Use very few steps for testing
      guidance_scale: 7,
      creativity: 0.25,
      resemblance: 0.75,
      hdr: 0,
      resolution: 'original',
      scheduler: 'DDIM',
      guess_mode: false
    }

    console.log('🧪 Test: Input parameters:', testInput)
    console.log('🧪 Test: Model Path:', MODEL_PATH)

    try {
      console.log('🧪 Test: Calling Replicate API...')
      // Use the predictions API for better control
      console.log('🔄 Test: Creating prediction...')
      const prediction = await replicate.predictions.create({
        version: MODEL_PATH,
        input: testInput
      })
      
      console.log('✅ Test: Prediction created successfully!')
      console.log('🧪 Test: Prediction ID:', prediction.id)
      console.log('🧪 Test: Prediction status:', prediction.status)
      
      // Wait for the prediction to complete
      let finalPrediction = prediction
      let attempts = 0
      const maxAttempts = 60 // 1 minute timeout for testing
      
      while (finalPrediction.status !== 'succeeded' && finalPrediction.status !== 'failed' && attempts < maxAttempts) {
        console.log('⏳ Test: Waiting for prediction... Status:', finalPrediction.status, 'Attempt:', attempts + 1)
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds between checks
        
        finalPrediction = await replicate.predictions.get(prediction.id)
        attempts++
      }
      
      if (finalPrediction.status === 'failed') {
        throw new Error(`Prediction failed: ${finalPrediction.error || 'Unknown error'}`)
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('Prediction timed out after 1 minute')
      }
      
      // Get the output URLs
      const output = finalPrediction.output
      console.log('✅ Test: Replicate API call successful!')
      console.log('🧪 Test: Final output:', output)
      
      return NextResponse.json({
        success: true,
        message: 'Replicate API test successful',
        output: output,
        modelPath: MODEL_PATH,
        timestamp: new Date().toISOString()
      })
      
    } catch (replicateError) {
      console.error('❌ Test: Replicate API call failed:', replicateError)
      console.error('❌ Test: Error details:', {
        message: replicateError instanceof Error ? replicateError.message : 'Unknown error',
        name: replicateError instanceof Error ? replicateError.name : 'Unknown error type',
        stack: replicateError instanceof Error ? replicateError.stack : 'No stack trace'
      })
      
      return NextResponse.json({
        success: false,
        error: 'Replicate API call failed',
        details: replicateError instanceof Error ? replicateError.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Test: General error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'General error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
