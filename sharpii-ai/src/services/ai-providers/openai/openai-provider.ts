import { BaseAIProvider } from '../common/base-provider'
import { ProviderConfig, EnhancementRequest, EnhancementResponse, ModelInfo, ProviderType } from '../common/types'
import { formatErrorMessage } from '../common/utils'

/**
 * OpenAI Provider for AI image enhancement
 * Currently uses DALL-E for image generation and editing
 */
export class OpenAIProvider extends BaseAIProvider {
  private baseUrl: string

  constructor(config: ProviderConfig) {
    super(config)
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1'
    this.initializeModels()
  }

  getProviderName(): string {
    return ProviderType.OPENAI
  }

  getProviderDisplayName(): string {
    return 'OpenAI'
  }

  /**
   * Enhance image using OpenAI API
   */
  async enhanceImage(request: EnhancementRequest, modelId: string): Promise<EnhancementResponse> {
    try {
      this.validateRequest(request)
      console.log(`🎨 OpenAI: Starting enhancement for ${request.imageUrl}`)

      const startTime = Date.now()
      const model = this.getModel(modelId) || this.models[0]
      const activeModelId = model ? model.id : modelId

      const enhancementPrompt = this.generateEnhancementPrompt(request)

      const responseUnknown = await this.callOpenAIAPI(request.imageUrl, enhancementPrompt)

      const processingTime = Date.now() - startTime

      // Narrow unknown response
      type OpenAIImage = { url?: unknown }
      type OpenAIResponse = { data?: OpenAIImage[]; request_id?: unknown }
      const resp = responseUnknown as OpenAIResponse

      if (!resp || !Array.isArray(resp.data) || resp.data.length === 0) {
        throw new Error('No enhanced image returned from OpenAI API')
      }

      const first = resp.data[0]
      const enhancedImageUrl = typeof first?.url === 'string' ? first.url : ''
      if (!enhancedImageUrl) {
        throw new Error('OpenAI API returned invalid image URL')
      }

      console.log(`✅ OpenAI: Enhancement completed in ${processingTime}ms`)

      return this.createSuccessResponse(enhancedImageUrl, request, activeModelId, {
        processingTime,
        timestamp: Date.now(),
        details: { prompt: enhancementPrompt, openaiRequestId: resp.request_id ? String(resp.request_id) : undefined }
      })
    } catch (error: unknown) {
      console.error('❌ OpenAI: Enhancement failed:', error)

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
   * Generate enhancement prompt based on request settings
   */
  private generateEnhancementPrompt(request: EnhancementRequest): string {
    let prompt = 'Enhance this image with improved quality, skin texture, and realism.'

    if (request.settings) {
      if ((request.settings as { style?: string }).style) {
        prompt += ` Style: ${(request.settings as { style?: string }).style}.`
      }

      if (request.settings && request.settings.guidance_scale && request.settings.guidance_scale > 0.7) {
        prompt += ' Apply strong enhancement effects.'
      } else {
        prompt += ' Apply subtle, natural enhancement effects.'
      }
    }

    prompt += ' Focus on skin improvement, detail enhancement, and overall image quality while maintaining natural appearance.'

    return prompt
  }

  /**
   * Call OpenAI API for image enhancement
   */
  private async callOpenAIAPI(imageUrl: string, prompt: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-2',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url'
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`)
    }

    return await response.json()
  }

  /**
   * Validate enhancement request
   */
  protected validateRequest(request: EnhancementRequest): void {
    super.validateRequest(request)

    if (!this.config.apiKey || !this.config.apiKey.trim()) {
      throw new Error('OpenAI API key not configured')
    }
  }

  /**
   * Check if provider is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.apiKey.trim())
  }

  /**
   * Initialize provider models
   */
  private initializeModels(): void {
    const provider = {
      name: ProviderType.OPENAI,
      displayName: 'OpenAI',
      description: 'OpenAI platform',
      supportedFeatures: ['image-editing', 'image-generation']
    }

    this.models = [
      {
        id: 'dall-e-3',
        name: 'DALL·E 3',
        displayName: 'DALL·E 3',
        description: 'Latest OpenAI image generation model',
        provider,
        capabilities: ['image-generation']
      },
      {
        id: 'dall-e-2',
        name: 'DALL·E 2',
        displayName: 'DALL·E 2',
        description: 'OpenAI image generation and edits',
        provider,
        capabilities: ['image-generation', 'image-editing']
      },
      {
        id: 'gpt-4-vision',
        name: 'GPT-4 Vision',
        displayName: 'GPT-4 Vision',
        description: 'Vision model for analysis and suggestions',
        provider,
        capabilities: ['image-analysis']
      }
    ]
  }
}