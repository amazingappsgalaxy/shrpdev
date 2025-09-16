import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'

// Mock tasks for testing workspace functionality
const mockTasks = [
  {
    id: 'task_1',
    userId: 'user_1',
    status: 'completed',
    progress: 100,
    originalImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    enhancedImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&contrast=120&brightness=110',
    modelName: 'Enhanced Clarity v2.1',
    provider: 'Replicate',
    creditsConsumed: 200,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    startedAt: new Date(Date.now() - 3500000).toISOString(),
    completedAt: new Date(Date.now() - 3200000).toISOString(),
    prompt: 'Enhance image clarity and reduce noise',
    processingTime: 45,
    metadata: { test: true }
  },
  {
    id: 'task_2',
    userId: 'user_1',
    status: 'processing',
    progress: 65,
    originalImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    enhancedImageUrl: null,
    modelName: 'Super Resolution 4x',
    provider: 'Replicate',
    creditsConsumed: 400, // Credits consumed even during processing
    createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    startedAt: new Date(Date.now() - 240000).toISOString(),
    completedAt: null,
    prompt: 'Upscale image to 4x resolution',
    processingTime: null,
    metadata: { test: true }
  },
  {
    id: 'task_3',
    userId: 'user_1',
    status: 'completed',
    progress: 100,
    originalImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    enhancedImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&saturation=130&contrast=110',
    modelName: 'Color Enhancement Pro',
    provider: 'OpenAI',
    creditsConsumed: 150,
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    startedAt: new Date(Date.now() - 7100000).toISOString(),
    completedAt: new Date(Date.now() - 6900000).toISOString(),
    prompt: 'Enhance colors and contrast',
    processingTime: 32,
    metadata: { test: true }
  },
  {
    id: 'task_4',
    userId: 'user_1',
    status: 'failed',
    progress: 0,
    originalImageUrl: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=400',
    enhancedImageUrl: null,
    modelName: 'Portrait Enhancer',
    provider: 'Replicate',
    creditsConsumed: 0,
    createdAt: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
    startedAt: new Date(Date.now() - 840000).toISOString(),
    completedAt: null,
    prompt: 'Enhance portrait lighting and skin tone',
    processingTime: null,
    errorMessage: 'Input image format not supported',
    metadata: { test: true }
  },
  {
    id: 'task_5',
    userId: 'user_1',
    status: 'pending',
    progress: 0,
    originalImageUrl: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?w=400',
    enhancedImageUrl: null,
    modelName: 'Background Removal',
    provider: 'RunningHub',
    creditsConsumed: 0,
    createdAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
    startedAt: null,
    completedAt: null,
    prompt: 'Remove background and clean edges',
    processingTime: null,
    metadata: { test: true }
  },
  {
    id: 'task_6',
    userId: 'user_1',
    status: 'completed',
    progress: 100,
    originalImageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
    enhancedImageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&brightness=120&contrast=115',
    modelName: 'Nature Enhancement',
    provider: 'Replicate',
    creditsConsumed: 180,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    startedAt: new Date(Date.now() - 86300000).toISOString(),
    completedAt: new Date(Date.now() - 86100000).toISOString(),
    prompt: 'Enhance natural landscape colors',
    processingTime: 38,
    metadata: { test: true }
  },
  {
    id: 'task_7',
    userId: 'user_1',
    status: 'processing',
    progress: 25,
    originalImageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
    enhancedImageUrl: null,
    modelName: 'HDR Enhancement Pro',
    provider: 'Replicate',
    creditsConsumed: 350, // Credits deducted during processing
    createdAt: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
    startedAt: new Date(Date.now() - 25000).toISOString(),
    completedAt: null,
    prompt: 'Apply HDR enhancement and dynamic range optimization',
    processingTime: null,
    metadata: { test: true }
  }
]

export async function GET(request: NextRequest) {
  try {
    console.log('Tasks API called')

    // Get user session from cookie
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const sessionData = await getSession(sessionToken)
    if (!sessionData?.user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const userId = sessionData.user.id
    console.log('Session found for user:', userId)

    // Get query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Fetch real tasks from Supabase
    let realTasks: any[] = []
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('⚠️ Supabase config missing, using mock data only')
      } else {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )

        let query = supabase
          .from('enhancement_tasks')
          .select('*')
          .eq('user_id', userId)  // Filter by user ID
          .order('created_at', { ascending: false })

        if (status && status !== 'all') {
          query = query.eq('status', status)
        }

        const { data, error } = await query

        if (error) {
          console.error('Supabase error:', error)
        } else if (data) {
          // Transform Supabase data to match our interface
          realTasks = data.map(task => ({
            id: task.id,
            userId: task.user_id,
            imageId: task.image_id,
            originalImageUrl: task.original_image_url,
            enhancedImageUrl: task.enhanced_image_url,
            status: task.status,
            progress: task.progress || 0,
            prompt: task.prompt,
            settings: task.settings ? (typeof task.settings === 'string' ? task.settings : JSON.stringify(task.settings)) : undefined,
            modelId: task.model_id,
            modelName: task.model_name,
            provider: task.provider,
            jobId: task.job_id,
            predictionId: task.prediction_id,
            errorMessage: task.error_message,
            processingTime: task.processing_time,
            estimatedTime: task.estimated_time,
            creditsConsumed: task.credits_consumed,
            taskTags: task.task_tags,
            originalWidth: task.original_width,
            originalHeight: task.original_height,
            originalFileSize: task.original_file_size,
            originalFileFormat: task.original_file_format,
            outputWidth: task.output_width,
            outputHeight: task.output_height,
            outputFileSize: task.output_file_size,
            outputFileFormat: task.output_file_format,
            createdAt: task.created_at,
            updatedAt: task.updated_at,
            startedAt: task.started_at,
            completedAt: task.completed_at,
            failedAt: task.failed_at
          }))

          console.log(`Found ${realTasks.length} real tasks from database`)
        }
      }
    } catch (dbError) {
      console.error('Database fetch error:', dbError)
    }

    // Only show real user tasks - no mock data for new users
    let allTasks = [...realTasks]

    // Only add mock tasks for specific test users (optional for development)
    if (process.env.NODE_ENV === 'development' && userId === 'user_1') {
      allTasks = [...realTasks, ...mockTasks]
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      allTasks = allTasks.filter(task => task.status === status)
    }

    // Sort by created date (most recent first)
    allTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Apply pagination
    const paginatedTasks = allTasks.slice(offset, offset + limit)

    console.log(`Returning ${paginatedTasks.length} tasks (${realTasks.length} real, ${mockTasks.length} mock)`)

    return NextResponse.json({
      tasks: paginatedTasks,
      total: allTasks.length,
      hasMore: offset + limit < allTasks.length
    })

  } catch (error) {
    console.error('Tasks list error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch tasks',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}