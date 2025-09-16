import { BaseAIProvider } from '../common/base-provider'
import { ProviderConfig, EnhancementRequest, EnhancementResponse, ModelInfo, ProviderType } from '../common/types'
import { formatErrorMessage } from '../common/utils'

/**
 * Fal.ai Provider for AI image enhancement
 * Supports various image enhancement models via Fal.ai API
 */
export class FalAIProvider extends BaseAIProvider {
  private baseUrl: string

  constructor(config: ProviderConfig) {
    super(config)
    this.baseUrl = config.baseUrl || 'https://fal.run'
    // Initialize available models for this provider
    this.initializeModels()
  }

  getProviderName(): string {
    return ProviderType.FAL_AI
  }

  getProviderDisplayName(): string {
    return 'Fal.ai'
  }

  /**
   * Enhance image using Fal.ai API
   */
  async enhanceImage(request: EnhancementRequest, modelId: string): Promise<EnhancementResponse> {
    try {
      this.validateRequest(request)
      console.log(`🎨 FalAI: Starting enhancement for ${request.imageUrl}`)

      const startTime = Date.now()

      // Verify model exists, otherwise fallback to first model
      const model = this.getModel(modelId) || this.models[0]
      const activeModelId = model ? model.id : modelId

      // Map model ID to Fal.ai model endpoint
      const modelEndpoint = this.getModelEndpoint(activeModelId)

      // Prepare the request payload for Fal.ai
      const payload = this.preparePayload(request)

      // Make the API call to Fal.ai
      const responseUnknown = await this.makeApiCall(modelEndpoint, payload)

      const processingTime = Date.now() - startTime

      // Narrow the unknown response safely
      type FalImage = { url?: unknown; width?: unknown; height?: unknown }
      type FalApiResponse = { images?: FalImage[]; request_id?: unknown }
      const resp = responseUnknown as FalApiResponse

      if (!resp || !Array.isArray(resp.images) || resp.images.length === 0) {
        throw new Error('No enhanced image returned from Fal.ai API')
      }

      const first = resp.images[0]
      const enhancedImageUrl = typeof first?.url === 'string' ? first.url : ''
      if (!enhancedImageUrl) {
        throw new Error('Fal.ai API returned invalid image URL')
      }

      console.log(`✅ FalAI: Enhancement completed in ${processingTime}ms`)

      return this.createSuccessResponse(enhancedImageUrl, request, activeModelId, {
        modelVersion: model?.version,
        processingTime,
        timestamp: Date.now(),
        details: {
          originalDimensions:
            typeof first?.width === 'number' && typeof first?.height === 'number'
              ? { width: first.width, height: first.height }
              : undefined,
          falJobId: resp.request_id ? String(resp.request_id) : undefined
        }
      })
    } catch (error: unknown) {
      console.error('❌ FalAI: Enhancement failed:', error)

      return this.createErrorResponse(
        formatErrorMessage(error),
        { originalUrl: request.imageUrl, error }
      )
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(): ModelInfo[] {
    return this.models
  }

  /**
   * Map internal model ID to Fal.ai model endpoint
   */
  private getModelEndpoint(modelId: string): string {
    const modelMap: Record<string, string> = {
      'fal-ai/flux-realism': 'fal-ai/flux-realism',
      'fal-ai/flux-pro': 'fal-ai/flux-pro',
      'fal-ai/stable-diffusion-xl': 'fal-ai/stable-diffusion-xl',
      'fal-ai/real-esrgan': 'fal-ai/real-esrgan',
      'fal-ai/face-enhance': 'fal-ai/face-enhance'
    }

    return modelMap[modelId] ?? 'fal-ai/flux-realism'
  }

  /**
   * Prepare API request payload for Fal.ai
   */
  private preparePayload(request: EnhancementRequest): Record<string, unknown> {
    const basePayload: Record<string, unknown> = {
      image_url: request.imageUrl,
      seed: Math.floor(Math.random() * 1000000),
      enable_safety_checker: true
    }

    // Add model-specific parameters
    if (request.settings) {
      if ((request.settings as { strength?: number }).strength !== undefined) {
        ;(basePayload as Record<string, unknown>).strength = (request.settings as { strength?: number }).strength
      }

      if (request.settings.guidance_scale !== undefined) {
        ;(basePayload as Record<string, unknown>).guidance_scale = request.settings.guidance_scale
      }

      if ((request.settings as { num_inference_steps?: number }).num_inference_steps !== undefined) {
        ;(basePayload as Record<string, unknown>).num_inference_steps = (request.settings as { num_inference_steps?: number }).num_inference_steps
      }
    }

    return basePayload
  }

  /**
   * Make API call to Fal.ai
   */
  private async makeApiCall(modelEndpoint: string, payload: Record<string, unknown>): Promise<unknown> {
    const url = `${this.baseUrl}/api/${modelEndpoint}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Fal.ai API error: ${response.status} - ${errorData}`)
    }

    return await response.json()
  }

  /**
   * Validate enhancement request
   */
  protected validateRequest(request: EnhancementRequest): void {
    // Use base validation first
    super.validateRequest(request)

    if (!this.config.apiKey || !this.config.apiKey.trim()) {
      throw new Error('Fal.ai API key not configured')
    }
  }

  /**
   * Check if provider is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.apiKey.trim())
  }

  // Initialize provider models (ModelInfo[])
  private initializeModels(): void {
    const provider = {
      name: ProviderType.FAL_AI,
      displayName: 'Fal.ai',
      description: 'Fal.ai platform',
      supportedFeatures: ['enhancement', 'upscaling']
    }

    this.models = [
      {
        id: 'fal-ai/flux-realism',
        name: 'FLUX Realism',
        displayName: 'FLUX Realism',
        description: 'Realistic image generation',
        provider,
        capabilities: ['image-generation', 'enhancement']
      },
      {
        id: 'fal-ai/flux-pro',
        name: 'FLUX Pro',
        displayName: 'FLUX Pro',
        description: 'Professional image enhancement',
        provider,
        capabilities: ['enhancement']
      },
      {
        id: 'fal-ai/stable-diffusion-xl',
        name: 'Stable Diffusion XL',
        displayName: 'Stable Diffusion XL',
        description: 'High quality diffusion model',
        provider,
        capabilities: ['image-generation', 'enhancement']
      },
      {
        id: 'fal-ai/real-esrgan',
        name: 'Real-ESRGAN',
        displayName: 'Real-ESRGAN',
        description: 'Super resolution enhancement',
        provider,
        capabilities: ['upscaling', 'enhancement']
      },
      {
        id: 'fal-ai/face-enhance',
        name: 'Face Enhance',
        displayName: 'Face Enhance',
        description: 'Face-specific enhancement',
        provider,
        capabilities: ['face-enhancement']
      }
    ]
  }
}