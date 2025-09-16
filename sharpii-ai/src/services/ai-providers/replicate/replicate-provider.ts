import Replicate from 'replicate'
import { BaseAIProvider } from '../common/base-provider'
import {
  EnhancementRequest,
  EnhancementResponse,
  ModelInfo,
  ProviderConfig,
  ProviderType
} from '../common/types'
import { sanitizeSettings, formatErrorMessage } from '../common/utils'

/**
 * Replicate AI Provider implementation
 */
export class ReplicateProvider extends BaseAIProvider {
  private replicate: Replicate

  constructor(config: ProviderConfig) {
    super(config)
    
    this.replicate = new Replicate({
      auth: config.apiKey
    })
    this.initializeModels()
  }

  getProviderName(): string {
    return ProviderType.REPLICATE
  }

  getProviderDisplayName(): string {
    return 'Replicate'
  }

  getAvailableModels(): ModelInfo[] {
    return this.models
  }

  isConfigured(): boolean {
    return !!this.replicate
  }

  private initializeModels(): void {
    this.models = [
      {
        id: 'replicate/batoure-face-enhancer',
        name: 'Batoure Face Enhancer',
        displayName: 'Batoure Face Enhancer',
        description: 'Enhances facial features, skin texture, and overall realism',
        provider: {
          name: ProviderType.REPLICATE,
          displayName: 'Replicate',
          description: 'Replicate AI platform',
          supportedFeatures: ['enhancement', 'upscaling']
        },
        version: '1.0.0',
        capabilities: ['face-enhancement', 'skin-texture']
      },
      {
        id: 'replicate/femat-skin-texture',
        name: 'Femat Skin Texture',
        displayName: 'Femat Skin Texture',
        description: 'Improves skin texture and removes blemishes',
        provider: {
          name: ProviderType.REPLICATE,
          displayName: 'Replicate',
          description: 'Replicate AI platform',
          supportedFeatures: ['enhancement']
        },
        version: '1.2.0',
        capabilities: ['skin-texture']
      },
      {
        id: 'replicate/magic-image-refiner',
        name: 'Magic Image Refiner',
        displayName: 'Magic Image Refiner',
        description: 'Refines image quality and details',
        provider: {
          name: ProviderType.REPLICATE,
          displayName: 'Replicate',
          description: 'Replicate AI platform',
          supportedFeatures: ['refinement']
        },
        version: '2.0.0',
        capabilities: ['refinement', 'quality-improvement']
      }
    ]
  }

  async enhanceImage(
    request: EnhancementRequest,
    modelId: string
  ): Promise<EnhancementResponse> {
    try {
      this.validateRequest(request)

      const model = this.getModel(modelId)
      if (!model) {
        return this.createErrorResponse(`Model ${modelId} not found`)
      }

      console.log('🚀 Replicate: Enhancement request received', {
        modelId,
        userId: request.userId,
        imageId: request.imageId
      })

      // Sanitize settings
      const settings = sanitizeSettings(request.settings)

      // Prepare input for Replicate API
      const input: Record<string, unknown> = {
        image: request.imageUrl,
        prompt: settings.prompt,
        negative_prompt: settings.negative_prompt || "teeth, tooth, open mouth, longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, mutant",
        steps: settings.steps || 20,
        guidance_scale: settings.guidance_scale || 7,
        creativity: settings.creativity || 0.25,
        resemblance: settings.resemblance || 0.75,
        hdr: settings.hdr || 0,
        resolution: settings.resolution || 'original',
        scheduler: settings.scheduler || 'DDIM',
        guess_mode: settings.guess_mode || false
      }

      // Only include seed if it's a valid integer
      if (settings.seed !== undefined && settings.seed !== null) {
        const seedStr = String(settings.seed)
        if (seedStr.trim() !== '') {
          const seedInt = parseInt(seedStr, 10)
          if (!isNaN(seedInt)) {
            ;(input as Record<string, unknown>).seed = seedInt
          }
        }
      }

      // Call Replicate API
      const modelRef = model.id as `${string}/${string}` | `${string}/${string}:${string}`
      const output = await this.replicate.run(modelRef, {
        input
      })

      // Extract image URL from output
      const imageUrl = this.extractImageUrl(output)
      if (!imageUrl) {
        throw new Error('Could not extract image URL from Replicate output')
      }

      return this.createSuccessResponse(imageUrl, request, modelId, {
        modelVersion: model.version,
        outputFormat: Array.isArray(output) ? 'array' : typeof output
      })

    } catch (error: unknown) {
      console.error('❌ Replicate: Enhancement failed', {
        error,
        errorMessage: error instanceof Error ? error.message : undefined,
      })
      
      // Try to get more detailed error info
      const maybeResp = (error as { response?: Response }).response
      if (maybeResp) {
        try {
          const errorText = await maybeResp.text()
          console.error('❌ Replicate: Error response body:', errorText)
        } catch {
          console.error('❌ Replicate: Could not read error response body')
         }
      }
      
      return this.createErrorResponse(
        formatErrorMessage(error),
        { originalError: error }
      )
    }
  }

  /**
   * Extract image URL from Replicate output
   */
  private extractImageUrl(output: unknown): string | null {
    if (!output) return null

    // Helper function to extract URL from FileOutput object
    const extractFromFileOutput = (item: unknown): string | null => {
      const maybeItem = item as { url?: () => unknown }
      if (maybeItem && typeof maybeItem.url === 'function') {
        try {
          const urlResult = maybeItem.url()
          // The url() method returns a URL object, we need the href property
          if (urlResult && typeof urlResult === 'object' && (urlResult as URL).href) {
            return (urlResult as URL).href
          }
          // Fallback to toString() for other cases
          if (urlResult && typeof (urlResult as { toString: () => string }).toString === 'function') {
            return (urlResult as { toString: () => string }).toString()
          }
          // Direct string return
          if (typeof urlResult === 'string') {
            return urlResult
          }
        } catch (error) {
          console.error('🚨 Replicate: Error calling url() method:', error)
          return null
        }
      }
      return null
    }

    // Handle single FileOutput object (new Replicate output format)
    if ((output as { constructor?: { name?: string } }).constructor?.name === 'FileOutput' || typeof (output as { url?: unknown }).url === 'function') {
      return extractFromFileOutput(output)
    }

    // Handle array output
    if (Array.isArray(output) && output.length > 0) {
      const firstItem = output[0] as unknown
      
      // Handle FileOutput object in array
      const fileOutputUrl = extractFromFileOutput(firstItem)
      if (fileOutputUrl) {
        return fileOutputUrl
      }
      
      // Direct URL string
      if (typeof firstItem === 'string') {
        return firstItem
      }
      
      // Object with url property
      const maybeFirst = firstItem as { url?: unknown }
      if (maybeFirst && maybeFirst.url) {
        return typeof maybeFirst.url === 'string' ? maybeFirst.url : String(maybeFirst.url)
      }
    }
    
    // Direct URL string
    if (typeof output === 'string') {
      return output
    }
    
    // Object with url property
    const maybeOut = output as { url?: unknown }
    if (maybeOut.url) {
      return typeof maybeOut.url === 'string' ? maybeOut.url : String(maybeOut.url)
    }

    return null
  }
}