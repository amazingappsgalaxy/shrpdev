import { NextRequest, NextResponse } from 'next/server'

// Mock tasks for testing workspace functionality
const mockTasks = [
  {
    id: 'task_1abc-def-ghi-jkl',
    userId: 'user_1xyz-abc-def-ghi',
    imageId: 'img_1abc-def-ghi-jkl',
    status: 'completed',
    progress: 100,
    originalImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    enhancedImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&contrast=120&brightness=110',
    modelId: 'clarity_v2_1',
    modelName: 'Enhanced Clarity v2.1',
    provider: 'Replicate',
    jobId: 'job_1abc-def-ghi-jkl',
    predictionId: 'pred_1abc-def-ghi',
    creditsConsumed: 200,
    taskTags: 'clarity, denoise, enhance',
    originalWidth: 2048,
    originalHeight: 1536,
    originalFileSize: 3145728, // 3MB
    originalFileFormat: 'jpg',
    outputWidth: 2048,
    outputHeight: 1536,
    outputFileSize: 4194304, // 4MB
    outputFileFormat: 'png',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updatedAt: new Date(Date.now() - 3200000).toISOString(),
    startedAt: new Date(Date.now() - 3500000).toISOString(),
    completedAt: new Date(Date.now() - 3200000).toISOString(),
    prompt: 'Enhance image clarity and reduce noise while preserving natural colors',
    settings: JSON.stringify({
      strength: 0.8,
      denoise_level: 0.7,
      preserve_details: true,
      output_format: 'png',
      quality: 95
    }),
    processingTime: 45,
    estimatedTime: 40
  },
  {
    id: 'task_2abc-def-ghi-jkl',
    userId: 'user_1xyz-abc-def-ghi',
    imageId: 'img_2abc-def-ghi-jkl',
    status: 'processing',
    progress: 65,
    originalImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    enhancedImageUrl: null,
    modelId: 'super_res_4x',
    modelName: 'Super Resolution 4x',
    provider: 'Replicate',
    jobId: 'job_2abc-def-ghi-jkl',
    predictionId: 'pred_2abc-def-ghi',
    creditsConsumed: 400,
    taskTags: 'upscale, super-resolution, 4x',
    originalWidth: 1024,
    originalHeight: 768,
    originalFileSize: 1572864, // 1.5MB
    originalFileFormat: 'jpg',
    createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    updatedAt: new Date(Date.now() - 60000).toISOString(),
    startedAt: new Date(Date.now() - 240000).toISOString(),
    completedAt: null,
    prompt: 'Upscale image to 4x resolution maintaining sharp details',
    settings: JSON.stringify({
      scale_factor: 4,
      algorithm: 'esrgan',
      face_enhance: false,
      output_format: 'jpg'
    }),
    processingTime: null,
    estimatedTime: 120
  },
  {
    id: 'task_3abc-def-ghi-jkl',
    userId: 'user_1xyz-abc-def-ghi',
    imageId: 'img_3abc-def-ghi-jkl',
    status: 'completed',
    progress: 100,
    originalImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    enhancedImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&saturation=130&contrast=110',
    modelId: 'color_enhance_pro',
    modelName: 'Color Enhancement Pro',
    provider: 'OpenAI',
    jobId: 'job_3abc-def-ghi-jkl',
    predictionId: 'pred_3abc-def-ghi',
    creditsConsumed: 150,
    taskTags: 'color, enhance, vibrant',
    originalWidth: 1920,
    originalHeight: 1280,
    originalFileSize: 2097152, // 2MB
    originalFileFormat: 'jpg',
    outputWidth: 1920,
    outputHeight: 1280,
    outputFileSize: 1835008, // 1.75MB
    outputFileFormat: 'jpg',
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 6900000).toISOString(),
    startedAt: new Date(Date.now() - 7100000).toISOString(),
    completedAt: new Date(Date.now() - 6900000).toISOString(),
    prompt: 'Enhance colors and contrast for a more vibrant look',
    settings: JSON.stringify({
      saturation: 1.3,
      contrast: 1.1,
      brightness: 1.05,
      warmth: 0.1
    }),
    processingTime: 32,
    estimatedTime: 30
  },
  {
    id: 'task_4abc-def-ghi-jkl',
    userId: 'user_1xyz-abc-def-ghi',
    imageId: 'img_4abc-def-ghi-jkl',
    status: 'failed',
    progress: 0,
    originalImageUrl: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=400',
    enhancedImageUrl: null,
    modelId: 'portrait_enhancer',
    modelName: 'Portrait Enhancer',
    provider: 'Replicate',
    jobId: 'job_4abc-def-ghi-jkl',
    predictionId: 'pred_4abc-def-ghi',
    creditsConsumed: 0,
    taskTags: 'portrait, skin, lighting',
    originalWidth: 1600,
    originalHeight: 1200,
    originalFileSize: 5242880, // 5MB
    originalFileFormat: 'tiff',
    createdAt: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
    updatedAt: new Date(Date.now() - 840000).toISOString(),
    startedAt: new Date(Date.now() - 840000).toISOString(),
    completedAt: null,
    failedAt: new Date(Date.now() - 840000).toISOString(),
    prompt: 'Enhance portrait lighting and skin tone for professional look',
    settings: JSON.stringify({
      skin_smoothing: 0.6,
      eye_enhancement: true,
      teeth_whitening: 0.3,
      background_blur: false
    }),
    processingTime: null,
    estimatedTime: 60,
    errorMessage: 'Input image format (TIFF) not supported by this model. Please convert to JPG or PNG format.'
  },
  {
    id: 'task_5abc-def-ghi-jkl',
    userId: 'user_1xyz-abc-def-ghi',
    imageId: 'img_5abc-def-ghi-jkl',
    status: 'pending',
    progress: 0,
    originalImageUrl: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?w=400',
    enhancedImageUrl: null,
    modelId: 'bg_removal_v3',
    modelName: 'Background Removal',
    provider: 'RunpodHub',
    creditsConsumed: 0,
    taskTags: 'background, removal, transparent',
    originalWidth: 1440,
    originalHeight: 1080,
    originalFileSize: 2621440, // 2.5MB
    originalFileFormat: 'png',
    createdAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
    updatedAt: new Date(Date.now() - 60000).toISOString(),
    startedAt: null,
    completedAt: null,
    prompt: 'Remove background and clean edges for product photography',
    settings: JSON.stringify({
      edge_refinement: true,
      alpha_matting: true,
      output_format: 'png'
    }),
    processingTime: null,
    estimatedTime: 25
  },
  {
    id: 'task_6abc-def-ghi-jkl',
    userId: 'user_1xyz-abc-def-ghi',
    imageId: 'img_6abc-def-ghi-jkl',
    status: 'completed',
    progress: 100,
    originalImageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
    enhancedImageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&brightness=120&contrast=115',
    modelId: 'nature_enhance',
    modelName: 'Nature Enhancement',
    provider: 'Replicate',
    jobId: 'job_6abc-def-ghi-jkl',
    predictionId: 'pred_6abc-def-ghi',
    creditsConsumed: 180,
    taskTags: 'nature, landscape, outdoor',
    originalWidth: 3840,
    originalHeight: 2160,
    originalFileSize: 6291456, // 6MB
    originalFileFormat: 'jpg',
    outputWidth: 3840,
    outputHeight: 2160,
    outputFileSize: 7340032, // 7MB
    outputFileFormat: 'jpg',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86100000).toISOString(),
    startedAt: new Date(Date.now() - 86300000).toISOString(),
    completedAt: new Date(Date.now() - 86100000).toISOString(),
    prompt: 'Enhance natural landscape colors and dynamic range',
    settings: JSON.stringify({
      hdr_enhancement: true,
      sky_replacement: false,
      foliage_enhancement: true,
      water_clarity: 0.8
    }),
    processingTime: 38,
    estimatedTime: 35
  }
]

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Filter tasks by status if provided
    let filteredTasks = mockTasks

    if (status && status !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === status)
    }

    // Apply pagination
    const paginatedTasks = filteredTasks.slice(offset, offset + limit)

    return NextResponse.json({
      tasks: paginatedTasks,
      total: filteredTasks.length,
      hasMore: offset + limit < filteredTasks.length
    })

  } catch (error) {
    console.error('Demo tasks list error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch tasks',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}