import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Simple API endpoint to simulate task creation for testing
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers) as Record<string, string>
    })

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Simulate creating a task
    const taskId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Mock task data
    let mockTask: any = {
      id: taskId,
      userId: session.user.id,
      status: 'pending',
      progress: 0,
      originalImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      enhancedImageUrl: null,
      modelName: 'Enhanced Clarity v2.1',
      provider: 'Replicate',
      creditsConsumed: 200,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      prompt: 'Enhance image clarity and reduce noise',
      settings: { strength: 0.8, steps: 20 },
      metadata: { test: true }
    }

    // Simulate task progression over time
    setTimeout(async () => {
      // Update to processing after 2 seconds
      mockTask.status = 'processing'
      mockTask.progress = 25
      mockTask.startedAt = new Date().toISOString()

      setTimeout(async () => {
        // Update to 50% after another 3 seconds
        mockTask.progress = 50

        setTimeout(async () => {
          // Complete after another 3 seconds
          mockTask.status = 'completed'
          mockTask.progress = 100
          mockTask.completedAt = new Date().toISOString()
          mockTask.enhancedImageUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=90'
        }, 3000)
      }, 3000)
    }, 2000)

    return NextResponse.json({
      success: true,
      task: mockTask,
      message: 'Test task created and will progress automatically'
    })

  } catch (error) {
    console.error('Test task creation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create test task',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}