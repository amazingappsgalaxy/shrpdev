import { NextRequest, NextResponse } from 'next/server';
import { EnhancementService } from '../../../services/ai-providers';
import type { EnhancementRequest } from '../../../services/ai-providers';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../../lib/config';
import { AIProviderFactory } from '../../../services/ai-providers/provider-factory';
import { getImageMetadata, calculateCreditsConsumed, getModelDisplayName } from '@/lib/image-metadata'
import { PricingEngine } from '@/lib/pricing-engine';
import { ModelPricingEngine } from '@/lib/model-pricing-config';
import { CreditManager } from '@/lib/credits';
import { UnifiedCreditsService } from '@/lib/unified-credits';
import { v4 as uuidv4 } from 'uuid';

type EnhancementOutputItem = { type: 'image' | 'video'; url: string }

const normalizeOutputs = (value: unknown): EnhancementOutputItem[] => {
  const isVideo = (url: string) => /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)
  const asItem = (url: string): EnhancementOutputItem => ({
    type: isVideo(url) ? 'video' : 'image',
    url
  })

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return asItem(item)
        if (item && typeof item === 'object') {
          const url = (item as { url?: string }).url
          const type = (item as { type?: 'image' | 'video' }).type
          if (url && type) return { url, type }
          if (url) return asItem(url)
        }
        return null
      })
      .filter((item): item is EnhancementOutputItem => !!item)
  }

  if (typeof value === 'string') {
    return [asItem(value)]
  }

  return []
}

export async function POST(request: NextRequest) {
  let taskId: string | null = null;
  let historySettings: any = null;
  
  // Initialize Supabase client
  const supabase = createClient(
    config.database.supabaseUrl,
    config.database.supabaseServiceKey
  );

  try {
    console.log('🚀 API: Enhancement request received')

    // TEMPORARY: Skip authentication for testing
    console.log('⚠️  TESTING MODE: Authentication bypassed')

    // TEMPORARY: Clear provider cache to force reload of RunningHubProvider (hot fix for dev)
    AIProviderFactory.clearCache()

    // Supabase client initialized outside try block

    const body = await request.json()
    const { imageUrl, settings, imageId = `img-${Date.now()}`, modelId, userId: requestUserId } = body

    // Ensure we use a valid UUID user id that exists in users table when in testing/bypass mode
    const isValidUUID = (v: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

    const ensureTestUser = async (): Promise<string> => {
      const fixedId = '11111111-1111-1111-1111-111111111111'
      const testEmail = 'test@local.dev'
      try {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('email', testEmail)
          .limit(1)
          .single()

        if (existing?.id) {
          return existing.id as string
        }
      } catch (e) {
        // ignore and try insert
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('users')
        .insert({
          id: fixedId,
          email: testEmail,
          name: 'Test User',
          password_hash: 'dev-test-hash'
        })
        .select('id')
        .single()

      if (insertErr) {
        console.error('❌ API: Failed to ensure test user:', insertErr)
        throw new Error(insertErr.message)
      }
      return inserted.id as string
    }

    const authenticatedUserId = requestUserId && typeof requestUserId === 'string' && isValidUUID(requestUserId)
      ? requestUserId
      : await ensureTestUser()

    const userId = authenticatedUserId // Use the authenticated user ID

    console.log('📋 API: Request details:', {
      imageUrl: imageUrl.substring(0, 50) + '...',
      userId,
      imageId,
      modelId,
      settings: {
        ...settings,
        prompt: settings.prompt ? settings.prompt.substring(0, 50) + '...' : 'No prompt provided'
      }
    })

    // Validate request
    if (!imageUrl || !settings || !modelId) {
      console.error('❌ API: Missing required fields:', {
        imageUrl: !!imageUrl,
        settings: !!settings,
        modelId: !!modelId
      })
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, settings, and modelId are required' },
        { status: 400 }
      )
    }

    console.log('✅ API: Validation passed, using EnhancementService')

    // Generate unique task ID using UUID
    taskId = uuidv4()
    const now = Date.now()

    historySettings = {
      style: settings.styleName || settings.style || null,
      mode: settings.mode || null,
      transformationStrength: settings.denoise ?? null,
      skinTextureSize: settings.megapixels ?? null,
      detailLevel: settings.maxshift ?? null
    }

    const historyPageName = settings.pageName || 'app/editor'

    // Create history item in Supabase with comprehensive validation
    try {
      console.log('📝 API: Creating history item in database...', {
        taskId,
        userId,
        imageId,
        provider: 'replicate',
        timestamp: now
      })

      const { error: insertError } = await supabase
        .from('history_items')
        .insert({
          id: taskId,
          user_id: userId,
          task_id: taskId,
          output_urls: [],
          model_name: getModelDisplayName(modelId),
          page_name: historyPageName,
          status: 'processing',
          settings: historySettings,
          created_at: new Date(now).toISOString(),
          updated_at: new Date(now).toISOString()
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to create task: ${insertError.message}`)
      }

      console.log('✅ API: History item created successfully in Supabase:', {
        taskId,
        userId,
        status: 'processing',
        timestamp: new Date(now).toISOString()
      })

      // Verify task was created by querying it back
      const { data: verifyTask, error: verifyError } = await supabase
        .from('history_items')
        .select('id, status, user_id')
        .eq('id', taskId)
        .single()

      if (verifyError || !verifyTask) {
        throw new Error('Task creation verification failed - task not found in database')
      }

      console.log('✅ API: History creation verified:', {
        taskId: verifyTask.id,
        status: verifyTask.status,
        userId: verifyTask.user_id
      })

    } catch (error) {
      console.error('❌ API: Failed to create task in Supabase:', error)
      return NextResponse.json(
        {
          error: 'Database operation failed',
          details: error instanceof Error ? error.message : 'Unknown database error',
          taskId
        },
        { status: 500 }
      )
    }

    // Get enhancement service instance
    const enhancementService = EnhancementService.getInstance()

    console.log('🌐 API: Starting enhancement with modular service', {
      modelId,
      userId,
      imageId,
      taskId
    })

    // Create progress callback to update history status in Supabase with validation
    const progressCallback = async (progress: number, status: string) => {
      try {
        const updateTime = Date.now()

        // Validate progress and status values
        if (typeof progress !== 'number' || progress < 0 || progress > 100) {
          console.warn('⚠️ API: Invalid progress value:', progress)
          progress = Math.max(0, Math.min(100, progress || 0))
        }

        if (!status || typeof status !== 'string') {
          console.warn('⚠️ API: Invalid status value:', status)
          status = 'processing'
        }

        console.log(`📊 API: Updating task progress...`, {
          taskId,
          progress,
          status,
          timestamp: new Date(updateTime).toISOString()
        })

        const safeStatus = status === 'failed' ? 'failed' : 'processing'
        const { error } = await supabase
          .from('history_items')
          .update({
            status: safeStatus,
            updated_at: new Date(updateTime).toISOString()
          })
          .eq('id', taskId)

        if (error) {
          throw error
        }

        console.log(`✅ API: History status updated successfully - ${progress}% (${status})`, { taskId })

      } catch (error) {
        console.error('❌ API: Failed to update progress:', {
          taskId,
          progress,
          status,
          error: error instanceof Error ? error.message : String(error)
        })
        // Don't throw here to avoid breaking the enhancement process
      }
    }

    // Create properly structured EnhancementRequest
    const enhancementRequest: EnhancementRequest = {
      imageUrl,
      settings,
      userId,
      imageId
    }

    // Pre-calculate credits needed for this enhancement
    let estimatedCredits = 0

    // Prioritize request dimensions for consistency with frontend display
    if (settings?.imageWidth && settings?.imageHeight) {
      try {
        // Use the new model-specific pricing engine with granular control
        const pricingBreakdown = ModelPricingEngine.calculateCredits(
          settings.imageWidth,
          settings.imageHeight,
          modelId,
          settings
        )
        estimatedCredits = pricingBreakdown.totalCredits
        console.log('💰 API: Enhanced credit estimation from request dimensions:', {
          dimensions: { width: settings.imageWidth, height: settings.imageHeight },
          megapixels: (settings.imageWidth * settings.imageHeight) / 1000000,
          estimatedCredits,
          breakdown: pricingBreakdown.breakdown,
          resolutionTier: pricingBreakdown.resolutionTier.description,
          appliedIncrements: pricingBreakdown.appliedIncrements.map(inc =>
            `${inc.settingName}: ${inc.addedCredits > 0 ? '+' : ''}${inc.addedCredits} credits (${inc.description})`
          ),
          taskId
        })
      } catch (error) {
        // Fallback to old pricing engine if model pricing engine fails
        console.warn('⚠️ API: Model pricing engine failed, trying old pricing engine:', error)
        try {
          const pricingBreakdown = PricingEngine.calculateCredits(
            settings.imageWidth,
            settings.imageHeight,
            modelId,
            settings
          )
          estimatedCredits = pricingBreakdown.totalCredits
          console.log('💰 API: Using fallback pricing engine:', { estimatedCredits })
        } catch (fallbackError) {
          // Final fallback to old calculation
          console.warn('⚠️ API: All pricing engines failed, using legacy calculation:', fallbackError)
          estimatedCredits = calculateCreditsConsumed(settings.imageWidth, settings.imageHeight)
          console.log('💰 API: Fallback credit estimation from request dimensions:', {
            dimensions: { width: settings.imageWidth, height: settings.imageHeight },
            megapixels: (settings.imageWidth * settings.imageHeight) / 1000000,
            estimatedCredits,
            taskId
          })
        }
      }
    } else {
      // Fallback to metadata extraction if request doesn't have dimensions
      try {
        const imageMetadata = await getImageMetadata(imageUrl)
        estimatedCredits = calculateCreditsConsumed(imageMetadata.width, imageMetadata.height)
        console.log('💰 API: Fallback credit estimation from metadata:', {
          dimensions: { width: imageMetadata.width, height: imageMetadata.height },
          megapixels: (imageMetadata.width * imageMetadata.height) / 1000000,
          estimatedCredits,
          taskId
        })
      } catch (error) {
        // Use default credit cost if no dimensions available at all
        estimatedCredits = 150 // Default base cost
        console.warn('⚠️ API: Using default credit estimation - no dimensions available:', { estimatedCredits, taskId })
      }
    }

    // Check user credit balance before enhancement
    const creditBalance = await UnifiedCreditsService.getUserCredits(authenticatedUserId)
    const userCreditBalance = creditBalance.remaining
    
    if (userCreditBalance < estimatedCredits && estimatedCredits > 0) {
      console.log('❌ API: Insufficient credits for enhancement:', {
        userId: authenticatedUserId,
        required: estimatedCredits,
        available: userCreditBalance,
        taskId
      })
      
      // Update task status to failed due to insufficient credits
      await supabase
        .from('history_items')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          generation_time_ms: 0,
          settings: {
            ...historySettings,
            failure_reason: 'Insufficient credits',
            failure_details: {
              required: estimatedCredits,
              available: userCreditBalance
            }
          }
        })
        .eq('id', taskId)
      
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          required: estimatedCredits,
          available: userCreditBalance,
          taskId
        },
        { status: 402 }
      )
    }

    // TEMPORARY: Bypass credit check for all users as per request
    // console.log('⚠️ API: Credit check bypassed temporarily')

    // Perform enhancement using the new modular system
    const result = await enhancementService.enhanceImage(enhancementRequest, modelId, progressCallback)

    // Extract metadata from original and enhanced images
    let originalMetadata = null
    let creditsConsumed = 0

    // Prioritize request dimensions for credit calculation (same as estimation)
    if (settings?.imageWidth && settings?.imageHeight) {
      try {
        // Use the new model-specific pricing engine with granular control
        const pricingBreakdown = ModelPricingEngine.calculateCredits(
          settings.imageWidth,
          settings.imageHeight,
          modelId,
          settings
        )
        creditsConsumed = pricingBreakdown.totalCredits
        console.log('💰 API: Enhanced final credit calculation from request dimensions:', {
          dimensions: { width: settings.imageWidth, height: settings.imageHeight },
          megapixels: (settings.imageWidth * settings.imageHeight) / 1000000,
          creditsConsumed,
          breakdown: pricingBreakdown.breakdown,
          resolutionTier: pricingBreakdown.resolutionTier.description,
          appliedIncrements: pricingBreakdown.appliedIncrements.map(inc =>
            `${inc.settingName}: ${inc.addedCredits > 0 ? '+' : ''}${inc.addedCredits} credits (${inc.description})`
          ),
          taskId
        })
      } catch (error) {
        // Fallback to old pricing engine if model pricing engine fails
        console.warn('⚠️ API: Model pricing engine failed for final calculation, trying old pricing engine:', error)
        try {
          const pricingBreakdown = PricingEngine.calculateCredits(
            settings.imageWidth,
            settings.imageHeight,
            modelId,
            settings
          )
          creditsConsumed = pricingBreakdown.totalCredits
          console.log('💰 API: Using fallback pricing engine for final calculation:', { creditsConsumed })
        } catch (fallbackError) {
          // Final fallback to old calculation
          console.warn('⚠️ API: All pricing engines failed for final calculation, using legacy calculation:', fallbackError)
          creditsConsumed = calculateCreditsConsumed(settings.imageWidth, settings.imageHeight)
          console.log('💰 API: Fallback final credit calculation from request dimensions:', {
            dimensions: { width: settings.imageWidth, height: settings.imageHeight },
            megapixels: (settings.imageWidth * settings.imageHeight) / 1000000,
            creditsConsumed,
            taskId
          })
        }
      }

      // Still try to get metadata for storage but don't use it for credits
      try {
        originalMetadata = await getImageMetadata(imageUrl)
        if (result.success && result.enhancedUrl) {
          const urlToMetadata = Array.isArray(result.enhancedUrl) ? result.enhancedUrl[0] : result.enhancedUrl
          if (urlToMetadata) {
            await getImageMetadata(urlToMetadata)
          }
        }
      } catch (error) {
        console.warn('⚠️ API: Could not extract image metadata (using request dimensions for credits):', error)
      }
    } else {
      // Fallback to metadata extraction if request doesn't have dimensions
      try {
        originalMetadata = await getImageMetadata(imageUrl)
        creditsConsumed = calculateCreditsConsumed(originalMetadata.width, originalMetadata.height)

        console.log('💰 API: Fallback credit calculation from metadata:', {
          dimensions: { width: originalMetadata.width, height: originalMetadata.height },
          megapixels: (originalMetadata.width * originalMetadata.height) / 1000000,
          creditsConsumed,
          taskId
        })

        // Get enhanced image metadata if successful
        if (result.success && result.enhancedUrl) {
          const urlToMetadata = Array.isArray(result.enhancedUrl) ? result.enhancedUrl[0] : result.enhancedUrl
          if (urlToMetadata) {
            await getImageMetadata(urlToMetadata)
          }
        }
      } catch (error) {
        console.error('❌ API: Failed to extract image metadata and no request dimensions available:', error)
        throw new Error('Unable to determine image dimensions for credit calculation')
      }
    }

    // Calculate processing time in seconds
    const processingTimeMs = result.metadata?.processingTime || (Date.now() - now)
    const processingTime = Math.round(processingTimeMs / 1000)

    // Update history in Supabase with comprehensive metadata and validation
    try {
      const completionTime = Date.now()
      const finalStatus = result.success ? 'completed' : 'failed'

      console.log('📝 API: Updating history completion in database...', {
        taskId,
        status: finalStatus,
        processingTime,
        creditsConsumed,
        hasEnhancedUrl: !!result.enhancedUrl,
        timestamp: new Date(completionTime).toISOString()
      })

      const updateData: any = {
        status: finalStatus,
        generation_time_ms: Math.max(0, processingTimeMs),
        updated_at: new Date(completionTime).toISOString(),
        model_name: getModelDisplayName(modelId)
      }

      // Add failure reason if failed
      if (!result.success) {
        updateData.settings = {
          ...historySettings,
          failure_reason: result.error || result.message || 'Unknown error',
          failure_details: result.metadata?.details || null
        }
      }

      // Add original image metadata with validation
      if (result.success && result.enhancedUrl) {
        const normalized = normalizeOutputs(result.outputs ?? result.enhancedUrl)
        updateData.output_urls = normalized
      }

      // Perform the database update
      const { error: updateError } = await supabase
        .from('history_items')
        .update(updateData)
        .eq('id', taskId)

      if (updateError) {
        throw new Error(`Failed to update task: ${updateError.message}`)
      }

      console.log('✅ API: History completion updated successfully in Supabase:', {
        taskId,
        status: finalStatus,
        processingTime,
        creditsConsumed,
        timestamp: new Date(completionTime).toISOString()
      })

      // Deduct credits from user account if enhancement was successful
      if (result.success && creditsConsumed > 0) {
        try {
          const description = `Image enhancement - ${originalMetadata?.width || 'unknown'}x${originalMetadata?.height || 'unknown'} pixels`
          const success = await UnifiedCreditsService.deductCredits(
            authenticatedUserId,
            creditsConsumed,
            taskId,
            description
          )

          if (success) {
            console.log('💳 API: Credits deducted successfully:', {
              taskId,
              creditsDeducted: creditsConsumed,
              newBalance: (await UnifiedCreditsService.getUserCredits(authenticatedUserId)).remaining
            })
          } else {
             throw new Error('Credit deduction returned false')
          }

        } catch (creditError) {
          console.error('❌ API: Failed to deduct credits:', {
            taskId,
            error: creditError instanceof Error ? creditError.message : String(creditError),
            creditsToDeduct: creditsConsumed,
            userId: authenticatedUserId
          })
          // Don't fail the enhancement if credit deduction fails
        }
      }
      // console.log('⚠️ API: Credit deduction temporarily disabled')

      // Verify the update by querying the task back
      const { data: updatedTask, error: verifyError } = await supabase
        .from('history_items')
        .select('id, status')
        .eq('id', taskId)
        .single()

      if (!updatedTask || verifyError) {
        console.error('❌ API: Task update verification failed - task not found')
      } else {
        // Verify that the stored credits match our calculation
        console.log('✅ API: Task update verified:', {
          taskId: updatedTask.id,
          status: updatedTask.status,
        })
      }

    } catch (updateError) {
      console.error('❌ API: Failed to update task completion in Supabase:', {
        taskId,
        error: updateError instanceof Error ? updateError.message : String(updateError)
      })
      // Continue execution even if database update fails
    }

    console.log('📤 API: Enhancement completed', {
      success: result.success,
      hasUrl: !!result.enhancedUrl,
      jobId: result.metadata?.jobId,
      taskId
    })

    const normalizedOutputs = normalizeOutputs(result.outputs ?? result.enhancedUrl)
    result.outputs = normalizedOutputs

    // Add taskId to response metadata
    if (result.metadata) {
      (result.metadata as any).taskId = taskId
    } else {
      result.metadata = { taskId } as any
    }

    // Return the result (success or error)
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 500 })
    }

  } catch (error) {
    console.error('❌ API: Image enhancement failed:', error)

    // Update history item to failed status if an exception occurred
    try {
      if (taskId) {
        await supabase
          .from('history_items')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
            generation_time_ms: 0,
            settings: {
              ...historySettings,
              failure_reason: error instanceof Error ? error.message : 'Unknown system error',
              failure_details: error
            }
          })
          .eq('id', taskId)
        console.log('✅ API: History item updated to failed state after exception')
      }
    } catch (dbError) {
      console.error('❌ API: Failed to update history item after exception:', dbError)
    }

    const errorResponse = {
      success: false,
      error: 'Image enhancement failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        timestamp: Date.now(),
        details: error
      }
    }

    console.error('📤 API: Sending error response:', errorResponse)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// GET endpoint to check enhancement status or get available models
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const jobId = searchParams.get('jobId')

    const enhancementService = EnhancementService.getInstance()

    if (action === 'models') {
      // Return available models
      const models = enhancementService.getAvailableModels()
      return NextResponse.json({ models })
    }

    if (action === 'status' && jobId) {
      // Return job status
      const job = enhancementService.getJobStatus(jobId)
      if (job) {
        return NextResponse.json({ job })
      } else {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }
    }

    if (action === 'providers') {
      // Return provider status
      const status = enhancementService.getProviderStatus()
      return NextResponse.json({ providers: status })
    }

    return NextResponse.json(
      {
        message: 'Supported actions: models, status (with jobId), providers',
        examples: [
          '?action=models',
          '?action=status&jobId=job_123',
          '?action=providers'
        ]
      }
    )
  } catch (error) {
    console.error('❌ API: GET request failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
