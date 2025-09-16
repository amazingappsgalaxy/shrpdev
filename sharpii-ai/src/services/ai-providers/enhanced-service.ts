import { AIProviderFactory } from './provider-factory'
import { ProviderType, EnhancementRequest, EnhancementResponse } from './common/types'

/**
 * Enhanced AI service that intelligently routes requests to the best provider
 * and provides fallback mechanisms for reliability
 */
export class EnhancedAIService {
  private static readonly PROVIDER_PRIORITY: ProviderType[] = [
    ProviderType.RUNNINGHUB, // Best for skin enhancement
    ProviderType.REPLICATE,  // Good general purpose
    ProviderType.FAL_AI,     // Fast and reliable
    ProviderType.OPENAI,     // Advanced AI but limited image editing
  ]

  /**
   * Enhance image with automatic provider selection and fallback
   */
  static async enhanceImageWithFallback(
    request: EnhancementRequest,
    modelId: string
  ): Promise<EnhancementResponse> {
    const availableProviders = this.getAvailableProviders()

    if (availableProviders.length === 0) {
      throw new Error('No AI providers are available or configured')
    }

    console.log(`🔄 Enhanced Service: Trying ${availableProviders.length} providers for ${modelId}`)

    let lastError: Error | null = null

    // Try providers in priority order
    for (const providerType of availableProviders) {
      try {
        console.log(`🎯 Enhanced Service: Attempting ${providerType}`)

        const provider = AIProviderFactory.getProvider(providerType)
        const result = await provider.enhanceImage(request, modelId)

        if (result.success) {
          console.log(`✅ Enhanced Service: Success with ${providerType}`)
          return result
        } else {
          console.warn(`⚠️ Enhanced Service: ${providerType} failed: ${result.error}`)
          lastError = new Error(result.error || 'Unknown error')
        }
      } catch (error) {
        console.error(`❌ Enhanced Service: ${providerType} error:`, error)
        lastError = error instanceof Error ? error : new Error(String(error))
      }
    }

    // All providers failed
    return {
      success: false,
      error: `All providers failed. Last error: ${lastError?.message || 'Unknown error'}`,
      message: 'Enhancement failed via fallback',
      metadata: {
        provider: 'enhanced-service',
        model: modelId,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Get the best provider for a specific model
   */
  static getBestProviderForModel(modelId: string): ProviderType {
    // Skin enhancement models
    if (modelId.includes('skin') || modelId.includes('face') || modelId.includes('portrait')) {
      return ProviderType.RUNNINGHUB
    }

    // FLUX models work well with Fal.ai
    if (modelId.includes('flux')) {
      return ProviderType.FAL_AI
    }

    // DALL-E models require OpenAI
    if (modelId.includes('dall-e') || modelId.includes('gpt')) {
      return ProviderType.OPENAI
    }

    // General models work well with Replicate
    return ProviderType.REPLICATE
  }

  /**
   * Enhance image with a specific provider
   */
  static async enhanceImageWithProvider(
    request: EnhancementRequest,
    providerType: ProviderType,
    modelId: string
  ): Promise<EnhancementResponse> {
    try {
      const provider = AIProviderFactory.getProvider(providerType)
      return await provider.enhanceImage(request, modelId)
    } catch (error) {
      console.error(`❌ Enhanced Service: Provider ${providerType} failed:`, error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Provider enhancement failed',
        metadata: {
          provider: providerType,
          model: modelId,
          timestamp: Date.now()
        }
      }
    }
  }

  /**
   * Get all available and configured providers
   */
  static getAvailableProviders(): ProviderType[] {
    return this.PROVIDER_PRIORITY.filter(providerType => {
      return AIProviderFactory.isProviderAvailable(providerType)
    })
  }

  /**
   * Get provider status for all providers
   */
  static async getProviderStatus(): Promise<Record<ProviderType, { available: boolean; models: string[] }>> {
    const status: Record<string, { available: boolean; models: string[] }> = {}

    for (const providerType of Object.values(ProviderType)) {
      try {
        const available = AIProviderFactory.isProviderAvailable(providerType)
        let models: string[] = []

        if (available) {
          const provider = AIProviderFactory.getProvider(providerType)
          models = provider.getAvailableModels().map(m => m.id)
        }

        status[providerType] = { available, models }
      } catch (error) {
        console.error(`Error checking provider ${providerType}:`, error)
        status[providerType] = { available: false, models: [] }
      }
    }

    return status as Record<ProviderType, { available: boolean; models: string[] }>
  }

  /**
   * Benchmark all providers with a test image
   */
  static async benchmarkProviders(testImageUrl: string): Promise<Record<ProviderType, {
    success: boolean;
    processingTime: number;
    error?: string
  }>> {
    const results: Record<string, { success: boolean; processingTime: number; error?: string }> = {}

    const testRequest: EnhancementRequest = {
      imageUrl: testImageUrl,
      settings: {
        prompt: 'Enhance image quality',
        guidance_scale: 7
      },
      userId: 'test-user',
      imageId: 'test-image'
    }

    const availableProviders = this.getAvailableProviders()
    const testModelId = 'test-model'

    for (const providerType of availableProviders) {
      const startTime = Date.now()

      try {
        const result = await this.enhanceImageWithProvider(testRequest, providerType, testModelId)
        const processingTime = Date.now() - startTime

        results[providerType] = {
          success: result.success,
          processingTime,
          error: result.success ? undefined : result.error
        }
      } catch (error) {
        results[providerType] = {
          success: false,
          processingTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }

    return results as Record<ProviderType, { success: boolean; processingTime: number; error?: string }>
  }

  /**
   * Get estimated processing time for a request
   */
  static estimateProcessingTime(request: EnhancementRequest, modelId: string): number {
    const baseTime = 30000 // 30 seconds base time

    // Adjust based on image dimensions (if available)
    // This would require image metadata analysis
    let sizeMultiplier = 1.0

    // Adjust based on model complexity
    if (modelId.includes('flux') || modelId.includes('xl')) {
      sizeMultiplier *= 1.5
    }

    // Adjust based on provider
    const provider = this.getBestProviderForModel(modelId)
    switch (provider) {
      case ProviderType.OPENAI:
        sizeMultiplier *= 0.8
        break
      case ProviderType.FAL_AI:
        sizeMultiplier *= 0.9
        break
      case ProviderType.REPLICATE:
        sizeMultiplier *= 1.0
        break
      case ProviderType.RUNNINGHUB:
        sizeMultiplier *= 1.2
        break
    }

    return Math.round(baseTime * sizeMultiplier)
  }

  /**
   * Validate request and return detailed errors (example utility)
   */
  static validateRequest(request: EnhancementRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!request.imageUrl) errors.push('Image URL is required')
    if (!request.settings) errors.push('Enhancement settings are required')

    // Example setting validations
    if (request.settings) {
      const { steps, guidance_scale } = request.settings
      if (typeof steps !== 'undefined' && (steps < 1 || steps > 100)) {
        errors.push('Steps must be between 1 and 100')
      }
      if (typeof guidance_scale !== 'undefined' && (guidance_scale < 0 || guidance_scale > 20)) {
        errors.push('Guidance scale must be between 0 and 20')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export default EnhancedAIService