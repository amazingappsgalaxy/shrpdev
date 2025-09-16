import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'

export async function DELETE(request: NextRequest) {
  try {
    const { taskId, userId } = await request.json()

    if (!taskId || !userId) {
      return NextResponse.json(
        { error: 'Task ID and User ID are required' },
        { status: 400 }
      )
    }

    console.log('🗑️ API: Deleting task:', { taskId, userId })

    // Initialize Supabase client
    const supabase = createClient(
      config.database.supabaseUrl,
      config.database.supabaseServiceKey
    )

    // Verify the task belongs to the user before deleting
    const { data: taskData, error: fetchError } = await supabase
      .from('enhancement_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !taskData) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the task
    const { error: deleteError } = await supabase
      .from('enhancement_tasks')
      .delete()
      .eq('id', taskId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    console.log('✅ API: Task deleted successfully:', taskId)

    return NextResponse.json({ success: true, taskId })
  } catch (error) {
    console.error('❌ API: Error deleting task:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete task',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}