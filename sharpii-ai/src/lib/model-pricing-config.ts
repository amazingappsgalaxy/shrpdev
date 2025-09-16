/**
 * Comprehensive Per-Model Pricing Configuration System
 * Allows granular control over base pricing by input resolution
 * and percentage increments for each model setting
 */

export interface ResolutionBasePricing {
  /** Resolution identifier (e.g., "1000x1000", "1500x1500") */
  resolution: string
  /** Width in pixels */
  width: number
  /** Height in pixels */
  height: number
  /** Megapixels (calculated) */
  megapixels: number
  /** Base price in credits for this resolution */
  baseCredits: number
  /** Human-readable description */
  description: string
}

export interface SettingPriceIncrement {
  /** Setting key (must match the model parameter) */
  settingKey: string
  /** Human-readable setting name */
  settingName: string
  /** Increment type */
  incrementType: 'percentage' | 'flat_credits' | 'conditional'
  /** Default increment value (0% for new settings) */
  defaultIncrement: number
  /** Whether this setting increment is enabled */
  enabled: boolean
  /** Default/minimum value for this setting */
  defaultValue: number
  /** Conditions for conditional pricing */
  conditions?: Array<{
    /** Condition function or value to match */
    when: any
    /** Increment value when condition is met */
    increment: number
    /** Description of the condition */
    description: string
  }>
  /** Description of what this setting does */
  description: string
}

export interface ModelPricingConfiguration {
  /** Model identifier */
  modelId: string
  /** Model display name */
  modelName: string
  /** Whether this model is enabled for pricing */
  enabled: boolean
  /** Base pricing by input resolution */
  resolutionPricing: ResolutionBasePricing[]
  /** Price increments for each setting */
  settingIncrements: SettingPriceIncrement[]
  /** Model-wide multiplier (applied after all calculations) */
  globalMultiplier: number
  /** Flat fee added to final calculation */
  flatFee: number
  /** Pricing notes/description */
  description?: string
  /** Last updated timestamp */
  lastUpdated: number
}

export interface PricingCalculationResult {
  /** Input image resolution */
  inputResolution: {
    width: number
    height: number
    megapixels: number
  }
  /** Matched resolution tier */
  resolutionTier: ResolutionBasePricing
  /** Base credits from resolution */
  baseCredits: number
  /** Applied setting increments */
  appliedIncrements: Array<{
    settingKey: string
    settingName: string
    settingValue: any
    incrementType: string
    incrementValue: number
    addedCredits: number
    description: string
  }>
  /** Global multiplier applied */
  globalMultiplier: number
  /** Flat fee added */
  flatFee: number
  /** Final total credits */
  totalCredits: number
  /** Detailed breakdown for display */
  breakdown: string[]
  /** Model used */
  modelId: string
  /** Calculation timestamp */
  calculatedAt: number
}

// Default pricing configurations for each model
export const MODEL_PRICING_CONFIGS: Record<string, ModelPricingConfiguration> = {
  'runninghub-flux-upscaling': {
    modelId: 'runninghub-flux-upscaling',
    modelName: 'RunningHub FLUX Upscaling',
    enabled: true,
    globalMultiplier: 1.0,
    flatFee: 0,
    resolutionPricing: [
      {
        resolution: '500x500',
        width: 500,
        height: 500,
        megapixels: 0.25,
        baseCredits: 50,
        description: '0.25MP - Very Small Images'
      },
      {
        resolution: '1000x1000',
        width: 1000,
        height: 1000,
        megapixels: 1.0,
        baseCredits: 120,
        description: '1MP - Standard Definition'
      },
      {
        resolution: '1500x1500',
        width: 1500,
        height: 1500,
        megapixels: 2.25,
        baseCredits: 180,
        description: '2.25MP - High Definition'
      },
      {
        resolution: '2000x2000',
        width: 2000,
        height: 2000,
        megapixels: 4.0,
        baseCredits: 300,
        description: '4MP - 2K Resolution'
      },
      {
        resolution: '3000x3000',
        width: 3000,
        height: 3000,
        megapixels: 9.0,
        baseCredits: 500,
        description: '9MP - Ultra High Definition'
      },
      {
        resolution: '4000x4000',
        width: 4000,
        height: 4000,
        megapixels: 16.0,
        baseCredits: 800,
        description: '16MP - Professional Resolution'
      }
    ],
    settingIncrements: [
      {
        settingKey: 'enable_myupscaler',
        settingName: 'MyUpscaler Node',
        incrementType: 'percentage',
        defaultIncrement: 35, // +35% as requested
        enabled: true,
        defaultValue: 0, // false = 0, true = 1
        description: 'MyUpscaler processing increases cost by 35%'
      },
      {
        settingKey: 'megapixels',
        settingName: 'Target Megapixels',
        incrementType: 'conditional',
        defaultIncrement: 0,
        enabled: true,
        defaultValue: 1.0,
        conditions: [
          {
            when: (val: number, base: number) => val > base + 1,
            increment: 10, // +10% per increment as requested
            description: '+10% for each megapixel increment above base'
          },
          {
            when: (val: number, base: number) => val > base + 5,
            increment: 25, // Higher increment for significant increases
            description: '+25% for megapixel increases above 5MP from base'
          }
        ],
        description: 'Target Megapixels increases cost based on the target resolution'
      },
      {
        settingKey: 'steps',
        settingName: 'Processing Steps',
        incrementType: 'flat_credits',
        defaultIncrement: 5, // 5 credits per step above default
        enabled: true,
        defaultValue: 10,
        description: '5 credits per step above default (10)'
      },
      {
        settingKey: 'guidance_scale',
        settingName: 'Guidance Scale',
        incrementType: 'conditional',
        defaultIncrement: 0,
        enabled: true,
        defaultValue: 3.5,
        conditions: [
          {
            when: (val: number) => val > 5.0,
            increment: 5,
            description: '+5% for guidance scale above 5.0'
          },
          {
            when: (val: number) => val > 10.0,
            increment: 15,
            description: '+15% for guidance scale above 10.0'
          }
        ],
        description: 'Higher guidance scale increases processing cost'
      },
      {
        settingKey: 'denoise',
        settingName: 'Denoise Strength',
        incrementType: 'conditional',
        defaultIncrement: 0,
        enabled: true,
        defaultValue: 0.3,
        conditions: [
          {
            when: (val: number) => val > 0.5,
            increment: 8,
            description: '+8% for denoise strength above 0.5'
          },
          {
            when: (val: number) => val > 0.8,
            increment: 20,
            description: '+20% for high denoise strength above 0.8'
          }
        ],
        description: 'Higher denoise strength requires more processing'
      },
      {
        settingKey: 'enable_upscale',
        settingName: 'Enable Upscaling',
        incrementType: 'conditional',
        defaultIncrement: 0,
        enabled: true,
        defaultValue: 0,
        conditions: [
          {
            when: (val: boolean) => val === true,
            increment: 0,
            description: 'No additional cost for upscaling'
          },
          {
            when: (val: boolean) => val === false,
            increment: -30, // 30% discount when upscaling is disabled
            description: '-30% discount when upscaling is disabled'
          }
        ],
        description: 'Disabling upscaling provides a discount'
      },
      {
        settingKey: 'upscale_model',
        settingName: 'Upscale Model',
        incrementType: 'conditional',
        defaultIncrement: 0,
        enabled: true,
        defaultValue: 0,
        conditions: [
          {
            when: (val: string) => val === '4xRealWebPhoto_v4_dat2.pth',
            increment: 0,
            description: 'Standard upscale model'
          },
          {
            when: (val: string) => val === '4x-UltraSharp.pth',
            increment: 15,
            description: '+15% for UltraSharp model'
          },
          {
            when: (val: string) => val === 'RealESRGAN_x4plus.pth',
            increment: 10,
            description: '+10% for RealESRGAN model'
          }
        ],
        description: 'Different upscale models have different costs'
      },
      {
        settingKey: 'sampler_name',
        settingName: 'Sampling Method',
        incrementType: 'conditional',
        defaultIncrement: 0,
        enabled: true,
        defaultValue: 0,
        conditions: [
          {
            when: (val: string) => ['dpmpp_2m', 'euler'].includes(val),
            increment: 0,
            description: 'Standard sampling methods'
          },
          {
            when: (val: string) => ['dpmpp_sde', 'dpmpp_2s_ancestral'].includes(val),
            increment: 5,
            description: '+5% for advanced sampling methods'
          }
        ],
        description: 'Advanced sampling methods may increase cost'
      },
      {
        settingKey: 'scheduler',
        settingName: 'Noise Scheduler',
        incrementType: 'conditional',
        defaultIncrement: 0,
        enabled: true,
        defaultValue: 0,
        conditions: [
          {
            when: (val: string) => ['simple', 'sgm_uniform'].includes(val),
            increment: 0,
            description: 'Standard schedulers'
          },
          {
            when: (val: string) => ['karras', 'exponential', 'beta'].includes(val),
            increment: 3,
            description: '+3% for advanced schedulers'
          }
        ],
        description: 'Advanced noise schedulers may increase cost'
      }
    ],
    description: 'FLUX Advanced Upscaling model with granular pricing control',
    lastUpdated: Date.now()
  },

  // Example for other models - you can expand these
  'fermatresearch/magic-image-refiner': {
    modelId: 'fermatresearch/magic-image-refiner',
    modelName: 'Magic Image Refiner',
    enabled: true,
    globalMultiplier: 0.8, // 20% cheaper than FLUX
    flatFee: 0,
    resolutionPricing: [
      {
        resolution: '1000x1000',
        width: 1000,
        height: 1000,
        megapixels: 1.0,
        baseCredits: 80,
        description: '1MP - Standard Definition'
      },
      {
        resolution: '2000x2000',
        width: 2000,
        height: 2000,
        megapixels: 4.0,
        baseCredits: 200,
        description: '4MP - High Definition'
      }
    ],
    settingIncrements: [
      {
        settingKey: 'creativity',
        settingName: 'Creativity Level',
        incrementType: 'conditional',
        defaultIncrement: 0,
        enabled: true,
        defaultValue: 0.5,
        conditions: [
          {
            when: (val: number) => val > 0.5,
            increment: 20,
            description: '+20% for high creativity'
          }
        ],
        description: 'Higher creativity increases processing cost'
      },
      {
        settingKey: 'hdr',
        settingName: 'HDR Enhancement',
        incrementType: 'percentage',
        defaultIncrement: 10,
        enabled: true,
        defaultValue: 0,
        description: 'HDR processing adds 10% to cost'
      }
    ],
    description: 'Balanced enhancement model with good quality',
    lastUpdated: Date.now()
  }
}

/**
 * Pricing Engine for calculating credits based on per-model configuration
 */
export class ModelPricingEngine {
  // Storage key for persisting configurations
  private static STORAGE_KEY = 'model-pricing-configs'

  /**
   * Load configurations from localStorage or use defaults
   */
  private static loadConfigurations(): Record<string, ModelPricingConfiguration> {
    if (typeof window === 'undefined') return MODEL_PRICING_CONFIGS // SSR fallback

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsedConfigs = JSON.parse(stored)
        // Merge with defaults to ensure new fields are present
        const merged = { ...MODEL_PRICING_CONFIGS }
        Object.keys(parsedConfigs).forEach(modelId => {
          if (merged[modelId]) {
            merged[modelId] = { ...merged[modelId], ...parsedConfigs[modelId] }
          }
        })
        return merged
      }
    } catch (error) {
      console.warn('Failed to load stored pricing configurations:', error)
    }

    return MODEL_PRICING_CONFIGS
  }

  /**
   * Save configurations to localStorage
   */
  private static saveConfigurations(configs: Record<string, ModelPricingConfiguration>): void {
    if (typeof window === 'undefined') return // SSR fallback

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs))
    } catch (error) {
      console.warn('Failed to save pricing configurations:', error)
    }
  }

  /**
   * Get current configurations (from storage if available)
   */
  private static getCurrentConfigs(): Record<string, ModelPricingConfiguration> {
    return this.loadConfigurations()
  }

  /**
   * Calculate credits for an image enhancement task
   */
  static calculateCredits(
    width: number,
    height: number,
    modelId: string,
    settings: Record<string, any> = {}
  ): PricingCalculationResult {
    const megapixels = (width * height) / 1000000

    // Get model configuration
    const configs = this.getCurrentConfigs()
    const modelConfig = configs[modelId]
    if (!modelConfig || !modelConfig.enabled) {
      throw new Error(`Model ${modelId} not found or disabled`)
    }

    // Find the appropriate resolution tier
    const resolutionTier = this.findResolutionTier(width, height, modelConfig.resolutionPricing)

    // Start with base credits
    let totalCredits = resolutionTier.baseCredits
    const appliedIncrements: PricingCalculationResult['appliedIncrements'] = []
    const breakdown: string[] = [`Base (${resolutionTier.description}): ${resolutionTier.baseCredits} credits`]

    // Apply setting increments
    for (const settingIncrement of modelConfig.settingIncrements) {
      // Skip if this setting increment is disabled
      if (settingIncrement.enabled === false) {
        continue
      }

      const settingValue = settings[settingIncrement.settingKey]

      if (settingValue === undefined || settingValue === null) {
        continue
      }

      const incrementResult = this.calculateSettingIncrement(
        settingIncrement,
        settingValue,
        totalCredits,
        megapixels
      )

      if (incrementResult.addedCredits !== 0) {
        appliedIncrements.push(incrementResult)
        totalCredits += incrementResult.addedCredits

        const sign = incrementResult.addedCredits > 0 ? '+' : ''
        breakdown.push(
          `${incrementResult.settingName}: ${sign}${incrementResult.addedCredits} credits (${incrementResult.description})`
        )
      }
    }

    // Apply global multiplier
    if (modelConfig.globalMultiplier !== 1.0) {
      const multipliedCredits = Math.round(totalCredits * modelConfig.globalMultiplier)
      const difference = multipliedCredits - totalCredits
      totalCredits = multipliedCredits
      breakdown.push(`Model multiplier (${modelConfig.globalMultiplier}x): ${difference > 0 ? '+' : ''}${difference} credits`)
    }

    // Apply flat fee
    if (modelConfig.flatFee > 0) {
      totalCredits += modelConfig.flatFee
      breakdown.push(`Model flat fee: +${modelConfig.flatFee} credits`)
    }

    breakdown.push(`Total: ${totalCredits} credits`)

    return {
      inputResolution: {
        width,
        height,
        megapixels
      },
      resolutionTier,
      baseCredits: resolutionTier.baseCredits,
      appliedIncrements,
      globalMultiplier: modelConfig.globalMultiplier,
      flatFee: modelConfig.flatFee,
      totalCredits,
      breakdown,
      modelId,
      calculatedAt: Date.now()
    }
  }

  /**
   * Find the appropriate resolution tier for given dimensions
   */
  private static findResolutionTier(
    width: number,
    height: number,
    resolutionPricing: ResolutionBasePricing[]
  ): ResolutionBasePricing {
    const inputMegapixels = (width * height) / 1000000

    // Sort by megapixels ascending
    const sortedTiers = [...resolutionPricing].sort((a, b) => a.megapixels - b.megapixels)

    // Find the first tier that can handle this resolution
    for (const tier of sortedTiers) {
      if (inputMegapixels <= tier.megapixels) {
        return tier
      }
    }

    // If no tier found, use the highest one
    const fallbackTier = sortedTiers[sortedTiers.length - 1]
    if (!fallbackTier) {
      throw new Error('No resolution tiers defined for this model')
    }
    return fallbackTier
  }

  /**
   * Calculate the increment for a specific setting
   */
  private static calculateSettingIncrement(
    settingIncrement: SettingPriceIncrement,
    settingValue: any,
    currentCredits: number,
    megapixels: number
  ): PricingCalculationResult['appliedIncrements'][0] {
    let addedCredits = 0
    let description = settingIncrement.description

    if (settingIncrement.incrementType === 'percentage') {
      // Percentage increment with default value logic
      if (typeof settingValue === 'boolean') {
        // For boolean settings: true above default (false)
        if (settingValue && settingIncrement.defaultValue === 0) {
          addedCredits = Math.round((currentCredits * settingIncrement.defaultIncrement) / 100)
          description = `${settingIncrement.defaultIncrement}% increment (enabled)`
        }
      } else if (typeof settingValue === 'number') {
        // For numeric settings: apply percentage if value > defaultValue
        const stepsAboveDefault = settingValue - settingIncrement.defaultValue
        if (stepsAboveDefault > 0) {
          // For percentage, we can either apply once if above default, or proportionally
          // For now, applying percentage once if above default
          addedCredits = Math.round((currentCredits * settingIncrement.defaultIncrement) / 100)
          description = `${settingIncrement.defaultIncrement}% increment (${settingValue} vs default ${settingIncrement.defaultValue})`
        }
      }
    } else if (settingIncrement.incrementType === 'flat_credits') {
      // Flat credit addition with default value logic
      if (typeof settingValue === 'boolean') {
        // For boolean settings: true above default (false)
        if (settingValue && settingIncrement.defaultValue === 0) {
          addedCredits = settingIncrement.defaultIncrement
          description = `${settingIncrement.defaultIncrement} flat credits (enabled)`
        }
      } else if (typeof settingValue === 'number') {
        // For numeric settings: multiply by steps above defaultValue
        const stepsAboveDefault = settingValue - settingIncrement.defaultValue
        if (stepsAboveDefault > 0) {
          addedCredits = stepsAboveDefault * settingIncrement.defaultIncrement
          description = `${stepsAboveDefault} × ${settingIncrement.defaultIncrement} = ${addedCredits} flat credits (${settingValue} vs default ${settingIncrement.defaultValue})`
        }
      }
    } else if (settingIncrement.incrementType === 'conditional' && settingIncrement.conditions) {
      // Conditional pricing
      for (const condition of settingIncrement.conditions) {
        let matches = false

        if (typeof condition.when === 'function') {
          try {
            matches = condition.when(settingValue, megapixels)
          } catch (error) {
            console.warn(`Error evaluating condition for ${settingIncrement.settingKey}:`, error)
            continue
          }
        } else {
          matches = condition.when === settingValue
        }

        if (matches) {
          addedCredits = Math.round((currentCredits * condition.increment) / 100)
          description = condition.description
          break // Only apply the first matching condition
        }
      }
    }

    return {
      settingKey: settingIncrement.settingKey,
      settingName: settingIncrement.settingName,
      settingValue,
      incrementType: settingIncrement.incrementType,
      incrementValue: settingIncrement.incrementType === 'percentage' ? settingIncrement.defaultIncrement : addedCredits,
      addedCredits,
      description
    }
  }

  /**
   * Get all available models with their pricing info
   */
  static getAvailableModels(): ModelPricingConfiguration[] {
    const configs = this.getCurrentConfigs()
    return Object.values(configs).filter(config => config.enabled)
  }

  /**
   * Get model configuration
   */
  static getModelConfig(modelId: string): ModelPricingConfiguration | undefined {
    const configs = this.getCurrentConfigs()
    return configs[modelId]
  }

  /**
   * Update model pricing configuration
   */
  static updateModelConfig(modelId: string, updates: Partial<ModelPricingConfiguration>): boolean {
    const configs = this.getCurrentConfigs()
    if (configs[modelId]) {
      configs[modelId] = {
        ...configs[modelId],
        ...updates,
        lastUpdated: Date.now()
      }
      this.saveConfigurations(configs)
      return true
    }
    return false
  }

  /**
   * Add new resolution tier to a model
   */
  static addResolutionTier(modelId: string, resolutionTier: ResolutionBasePricing): boolean {
    const configs = this.getCurrentConfigs()
    const config = configs[modelId]
    if (config) {
      config.resolutionPricing.push(resolutionTier)
      config.lastUpdated = Date.now()
      this.saveConfigurations(configs)
      return true
    }
    return false
  }

  /**
   * Update setting increment for a model
   */
  static updateSettingIncrement(
    modelId: string,
    settingKey: string,
    updates: Partial<SettingPriceIncrement>
  ): boolean {
    const configs = this.getCurrentConfigs()
    const config = configs[modelId]
    if (config) {
      const incrementIndex = config.settingIncrements.findIndex(inc => inc.settingKey === settingKey)
      if (incrementIndex >= 0) {
        const currentIncrement = config.settingIncrements[incrementIndex]
        config.settingIncrements[incrementIndex] = {
          settingKey: currentIncrement.settingKey,
          settingName: currentIncrement.settingName,
          incrementType: currentIncrement.incrementType,
          defaultIncrement: currentIncrement.defaultIncrement,
          enabled: currentIncrement.enabled ?? true,
          defaultValue: currentIncrement.defaultValue ?? 0,
          description: currentIncrement.description,
          ...updates
        }
        config.lastUpdated = Date.now()
        this.saveConfigurations(configs)
        return true
      }
    }
    return false
  }

  /**
   * Add new setting increment to a model
   */
  static addSettingIncrement(modelId: string, settingIncrement: SettingPriceIncrement): boolean {
    const configs = this.getCurrentConfigs()
    const config = configs[modelId]
    if (config) {
      config.settingIncrements.push(settingIncrement)
      config.lastUpdated = Date.now()
      this.saveConfigurations(configs)
      return true
    }
    return false
  }

  /**
   * Get pricing preview for different scenarios
   */
  static getPricingPreview(
    modelId: string,
    scenarios: Array<{
      name: string
      width: number
      height: number
      settings: Record<string, any>
    }>
  ) {
    return scenarios.map(scenario => ({
      ...scenario,
      pricing: this.calculateCredits(scenario.width, scenario.height, modelId, scenario.settings)
    }))
  }
}

// Helper function for backward compatibility
export function calculateModelCredits(
  width: number,
  height: number,
  modelId: string,
  settings: Record<string, any> = {}
): number {
  try {
    const result = ModelPricingEngine.calculateCredits(width, height, modelId, settings)
    return result.totalCredits
  } catch (error) {
    console.error('Error calculating model credits:', error)
    // Fallback to basic calculation
    const megapixels = (width * height) / 1000000
    if (megapixels <= 1) return 60
    if (megapixels <= 2.25) return 120
    if (megapixels <= 4.66) return 360
    return 500
  }
}