import { NextRequest, NextResponse } from 'next/server';
import { config } from '../../../lib/config';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Get user session using better-auth
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers) as Record<string, string>
    });
    
    let userId = session?.user?.id;
    
    // Final fallback
    if (!userId) {
      userId = '1';
    }
    
    console.log('🧪 Creating test data for user:', userId);

    // Initialize Supabase client
    const supabase = createClient(
      config.database.supabaseUrl,
      config.database.supabaseServiceKey
    );

    const now = Date.now();
    const tasks = [];

    // Task 1: Completed task
    const taskId1 = uuidv4();
    tasks.push({
      id: taskId1,
      user_id: userId,
      image_id: 'test-image-1',
      original_image_url: 'https://picsum.photos/400/300?random=1',
      enhanced_image_url: 'https://picsum.photos/400/300?random=2',
      status: 'completed',
      progress: 100,
      prompt: 'Enhance this beautiful landscape photo',
      settings: JSON.stringify({ quality: 'high', style: 'natural' }),
      model_id: 'femat-magic-image-refiner',
      provider: 'replicate',
      processing_time: 45000,
      started_at: new Date(now - 60000).toISOString(),
      completed_at: new Date(now - 15000).toISOString(),
      created_at: new Date(now - 60000).toISOString(),
      updated_at: new Date(now - 15000).toISOString(),
      metadata: JSON.stringify({ testData: true, version: '1.0' })
    });

    // Task 2: Processing task
    const taskId2 = uuidv4();
    tasks.push({
      id: taskId2,
      user_id: userId,
      image_id: 'test-image-2',
      original_image_url: 'https://picsum.photos/400/300?random=3',
      status: 'processing',
      progress: 65,
      prompt: 'Improve the lighting and colors in this portrait',
      settings: JSON.stringify({ quality: 'ultra', style: 'portrait' }),
      model_id: 'femat-magic-image-refiner',
      provider: 'replicate',
      started_at: new Date(now - 30000).toISOString(),
      created_at: new Date(now - 30000).toISOString(),
      updated_at: new Date(now - 5000).toISOString(),
      metadata: JSON.stringify({ testData: true, version: '1.0' })
    });

    // Task 3: Failed task
    const taskId3 = uuidv4();
    tasks.push({
      id: taskId3,
      user_id: userId,
      image_id: 'test-image-3',
      original_image_url: 'https://picsum.photos/400/300?random=4',
      status: 'failed',
      progress: 0,
      prompt: 'Enhance this architectural photo',
      settings: JSON.stringify({ quality: 'medium', style: 'architectural' }),
      model_id: 'femat-magic-image-refiner',
      provider: 'replicate',
      error_message: 'Processing failed due to invalid image format',
      started_at: new Date(now - 120000).toISOString(),
      created_at: new Date(now - 120000).toISOString(),
      updated_at: new Date(now - 90000).toISOString(),
      metadata: JSON.stringify({ testData: true, version: '1.0' })
    });

    // Insert all tasks
    const { error } = await supabase
      .from('enhancement_tasks')
      .insert(tasks);

    if (error) {
      throw new Error(error.message);
    }

    console.log('✅ Test data created successfully:', {
      userId,
      taskIds: [taskId1, taskId2, taskId3],
      count: tasks.length
    });

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      data: {
        userId,
        taskIds: [taskId1, taskId2, taskId3],
        count: tasks.length
      }
    });

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    return NextResponse.json(
      {
        error: 'Failed to create test data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user session using better-auth
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers) as Record<string, string>
    });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log('🧹 Cleaning test data for user:', userId);

    // Initialize Supabase client
    const supabase = createClient(
      config.database.supabaseUrl,
      config.database.supabaseServiceKey
    );

    // Delete all enhancement tasks for this user
    const { error } = await supabase
      .from('enhancement_tasks')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    const deletedCount = 0; // Supabase delete doesn't return count by default

    console.log('✅ Test data cleaned successfully:', {
      userId,
      deletedCount
    });

    return NextResponse.json({
      success: true,
      message: 'Test data cleaned successfully',
      data: {
        userId,
        deletedCount
      }
    });

  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
    return NextResponse.json(
      {
        error: 'Failed to clean test data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}