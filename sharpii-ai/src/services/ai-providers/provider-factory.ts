import { ProviderType, type ProviderConfig } from './common/types'
import { ReplicateProvider } from './replicate/replicate-provider'
import { RunningHubProvider } from './runninghub/runninghub-provider'
import { FalAIProvider } from './fal/fal-provider'
import { OpenAIProvider } from './openai/openai-provider'
import { config } from '../../lib/config'
import { BaseAIProvider } from './common/base-provider'

/**
 * Factory class for creating AI provider instances
 * Implements singleton pattern for each provider type
 */
export class AIProviderFactory {
  private static providers = new Map<ProviderType, BaseAIProvider>()

  /**
   * Get or create a provider instance
   */
  static getProvider(type: ProviderType, config?: ProviderConfig): BaseAIProvider {
    // Check if provider already exists
    if (this.providers.has(type)) {
      return this.providers.get(type) as BaseAIProvider
    }

    // Create new provider instance
    const provider = this.createProvider(type, config)
    
    // Cache the provider instance
    this.providers.set(type, provider)
    
    return provider
  }

  /**
   * Create a new provider instance
   */
  private static createProvider(type: ProviderType, config?: ProviderConfig): BaseAIProvider {
    const providerConfig = config || this.getDefaultConfig(type)

    switch (type) {
      case ProviderType.REPLICATE:
        return new ReplicateProvider(providerConfig)
      
      case ProviderType.RUNNINGHUB:
        return new RunningHubProvider(providerConfig)
      
      case ProviderType.FAL_AI:
        return new FalAIProvider(providerConfig)

      case ProviderType.OPENAI:
        return new OpenAIProvider(providerConfig)
      
      default:
        throw new Error(`Unsupported provider type: ${type}`)
    }
  }

  /**
   * Get default configuration for a provider
   */
  private static getDefaultConfig(type: ProviderType): ProviderConfig {
    switch (type) {
      case ProviderType.REPLICATE:
        return {
          apiKey: config.ai.replicate.apiToken,
          timeout: config.ai.replicate.timeout,
          retries: config.ai.replicate.retries
        }
      
      case ProviderType.RUNNINGHUB:
        return {
          apiKey: config.ai.runninghub.apiToken,
          baseUrl: config.ai.runninghub.baseUrl,
          timeout: config.ai.runninghub.timeout,
          retries: config.ai.runninghub.retries
        }
      
      case ProviderType.FAL_AI:
        return {
          apiKey: process.env.FAL_API_TOKEN || '',
          baseUrl: 'https://fal.run',
          timeout: 300000,
          retries: 3
        }
      
      case ProviderType.OPENAI:
        return {
          apiKey: process.env.OPENAI_API_KEY || '',
          baseUrl: 'https://api.openai.com/v1',
          timeout: 120000,
          retries: 3
        }
      
      default:
        throw new Error(`No default config available for provider type: ${type}`)
    }
  }

  /**
   * Get all available providers
   */
  static getAvailableProviders(): ProviderType[] {
    return Object.values(ProviderType)
  }

  /**
   * Check if a provider is configured and available
   */
  static isProviderAvailable(type: ProviderType): boolean {
    try {
      const config = this.getDefaultConfig(type)
      return !!config.apiKey
    } catch {
      return false
    }
  }

  /**
   * Get all configured providers
   */
  static getConfiguredProviders(): ProviderType[] {
    return this.getAvailableProviders().filter(type => this.isProviderAvailable(type))
  }

  /**
   * Clear provider cache (useful for testing or config changes)
   */
  static clearCache(): void {
    this.providers.clear()
  }

  /**
   * Get provider by model ID (useful when model ID contains provider info)
   */
  static getProviderByModelId(modelId: string): ProviderType {
    // For now, we'll use a simple mapping based on model ID patterns
    // This can be enhanced with a proper model registry later
    
    if (modelId.includes('batoure') || modelId.includes('femat') || modelId.includes('magic-image-refiner')) {
      return ProviderType.REPLICATE
    }
    
    if (modelId.includes('runninghub') || modelId.includes('flux-upscaling')) {
      return ProviderType.RUNNINGHUB
    }
    
    // Default to Replicate for backward compatibility
    return ProviderType.REPLICATE
  }
}