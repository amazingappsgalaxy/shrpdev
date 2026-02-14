import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../../../lib/config';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'sharpii_admin_secret_2024';
const EXPIRATION_DAYS = 45;

export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    if (token !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 403 }
      );
    }

    console.log('🧹 Starting expired task cleanup process...');

    // Initialize Supabase
    const supabase = createClient(config.database.supabaseUrl, config.database.supabaseServiceKey);

    // Calculate cutoff date (45 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - EXPIRATION_DAYS);
    const cutoffTimestamp = cutoffDate.toISOString();

    console.log(`🗓️ Cleanup cutoff date: ${cutoffDate.toISOString()} (${EXPIRATION_DAYS} days ago)`);

    // Query all enhancement tasks older than 45 days
    const { data: expiredTasks, error } = await supabase
      .from('enhancement_tasks')
      .select('*')
      .lt('created_at', cutoffTimestamp);

    if (error) {
      console.error('❌ Error querying expired tasks:', error);
      return NextResponse.json(
        { error: 'Failed to query expired tasks' },
        { status: 500 }
      );
    }
    console.log(`📋 Found ${expiredTasks.length} expired tasks to cleanup`);

    if (expiredTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired tasks found',
        deletedTasks: 0,
        deletedFiles: 0
      });
    }

    let deletedTasks = 0;
    let deletedFiles = 0;
    const errors: string[] = [];

    // Process each expired task
    for (const task of expiredTasks) {
      try {
        console.log(`🗑️ Processing expired task: ${task.id} (created: ${new Date(task.created_at).toISOString()})`);

        // Delete the task from database
        const { error: deleteError } = await supabase
          .from('enhancement_tasks')
          .delete()
          .eq('id', task.id);
        
        if (deleteError) {
          throw new Error(`Failed to delete task: ${deleteError.message}`);
        }
        
        deletedTasks++;
        console.log(`✅ Deleted task: ${task.id}`);

      } catch (taskError) {
        console.error(`❌ Failed to delete task ${task.id}:`, taskError);
        errors.push(`Failed to delete task ${task.id}: ${taskError}`);
      }
    }

    console.log(`🎉 Cleanup completed: ${deletedTasks} tasks deleted, ${deletedFiles} files deleted`);

    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      deletedTasks,
      deletedFiles,
      errors: errors.length > 0 ? errors : undefined,
      cutoffDate: cutoffDate.toISOString(),
      expirationDays: EXPIRATION_DAYS
    });

  } catch (error) {
    console.error('❌ Cleanup process failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup process failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    if (token !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 403 }
      );
    }

    // Initialize Supabase
    const supabase = createClient(config.database.supabaseUrl, config.database.supabaseServiceKey);

    // Calculate cutoff date (45 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - EXPIRATION_DAYS);
    const cutoffTimestamp = cutoffDate.toISOString();

    // Query expired tasks (for preview)
    const { data: expiredTasks, error } = await supabase
      .from('enhancement_tasks')
      .select('*')
      .lt('created_at', cutoffTimestamp);

    if (error) {
      console.error('❌ Error querying expired tasks for preview:', error);
      return NextResponse.json(
        { error: 'Failed to query expired tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      expiredTasksCount: expiredTasks.length,
      cutoffDate: cutoffDate.toISOString(),
      expirationDays: EXPIRATION_DAYS,
      expiredTasks: expiredTasks.map(task => ({
        id: task.id,
        createdAt: new Date(task.created_at).toISOString(),
        status: task.status,
        hasEnhancedImage: !!task.enhanced_image_url
      }))
    });

  } catch (error) {
    console.error('❌ Failed to get expired tasks info:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get expired tasks info',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}