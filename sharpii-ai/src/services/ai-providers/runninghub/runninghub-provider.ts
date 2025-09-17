import { BaseAIProvider } from '../common/base-provider'
import {
  EnhancementRequest,
  EnhancementResponse,
  ModelInfo,
  ProviderConfig,
  ProviderType,
  EnhancementSettings
} from '../common/types'
import { formatErrorMessage } from '../common/utils'

// Local types and guards to avoid using `any`
type RunningHubSettings = Partial<EnhancementSettings> & {
  denoise?: number
  sampler_name?: string
  scheduler?: string
  node_191_mode?: string | number | boolean
  node_192_mode?: string | number | boolean
  node_193_mode?: string | number | boolean
}

interface RunningHubOutputItem {
  nodeId?: string | number
  fileUrl?: string
}

interface RunningHubOutputsResponse {
  code: number
  data?: RunningHubOutputItem[]
  msg?: string
}

function isRunningHubOutputsResponse(val: unknown): val is RunningHubOutputsResponse {
  if (typeof val !== 'object' || val === null) return false
  const obj = val as Record<string, unknown>
  if (typeof obj.code !== 'number') return false
  if (obj.data !== undefined && !Array.isArray(obj.data)) return false
  return true
}


/**
 * RunningHub.ai Provider implementation
 * Integrates with RunningHub.ai ComfyUI API for image processing
 */
export class RunningHubProvider extends BaseAIProvider {
  private apiKey: string
  private baseUrl: string

  constructor(config: ProviderConfig) {
    super(config)
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://www.runninghub.ai'
    this.initializeModels()
  }

  getProviderName(): string {
    return ProviderType.RUNNINGHUB
  }

  getProviderDisplayName(): string {
    return 'RunningHub.ai'
  }

  getAvailableModels(): ModelInfo[] {
    return this.models
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.apiKey.trim())
  }

  private initializeModels(): void {
    this.models = [
      {
        id: 'runninghub-flux-upscaling',
        name: 'FLUX Upscaling Model',
        displayName: 'RunningHub FLUX Upscaling',
        description: 'Advanced ComfyUI-based image upscaling and enhancement model with FLUX architecture.',
        provider: {
          name: ProviderType.RUNNINGHUB,
          displayName: 'RunningHub.ai',
          description: 'ComfyUI cloud platform for advanced image processing',
          supportedFeatures: ['image-upscaling', 'enhancement', 'flux-processing']
        },
        version: '1.0',
        capabilities: [
          'image-upscaling',
          'quality-enhancement',
          'flux-processing',
          'comfyui-workflow',
          'advanced-enhancement'
        ],
        parameters: {
          prompt: {
            type: 'string',
            default: 'high quality, detailed, enhanced',
            description: 'Text prompt to guide the enhancement process'
          },
          seed: {
            type: 'number',
            default: 0,
            description: 'Random seed for reproducible results (leave empty for random)'
          },
          steps: {
            type: 'number',
            default: 10,
            min: 1,
            max: 50,
            description: 'Number of denoising steps'
          },
          guidance_scale: {
            type: 'number',
            default: 3.5,
            min: 1.0,
            max: 20.0,
            step: 0.1,
            description: 'Guidance scale for FLUX model'
          },
          denoise: {
            type: 'number',
            default: 0.3,
            min: 0.0,
            max: 1.0,
            step: 0.01,
            description: 'Denoising strength (0.0 = no change, 1.0 = complete regeneration)'
          },
          sampler_name: {
            type: 'select',
            default: 'dpmpp_2m',
            options: ['dpmpp_2m', 'euler', 'euler_ancestral', 'heun', 'dpm_2', 'dpm_2_ancestral', 'lms', 'dpmpp_sde', 'dpmpp_2s_ancestral'],
            description: 'Sampling method for generation'
          },
          scheduler: {
            type: 'select',
            default: 'sgm_uniform',
            options: ['simple', 'sgm_uniform', 'karras', 'exponential', 'ddim_uniform', 'beta', 'normal', 'linear_quadratic', 'kl_optimal', 'bong_tangent', 'beta57', 'ays', 'ays+', 'ays_30', 'ays_30+', 'gits', 'power_shift'],
            description: 'Noise scheduler type'
          },
          upscale_model: {
            type: 'select',
            default: '4xRealWebPhoto_v4_dat2.pth',
            options: ['4xRealWebPhoto_v4_dat2.pth', '4x_NMKD-Siax_200k.pth', '4x-UltraSharp.pth', 'RealESRGAN_x4plus.pth'],
            description: 'Upscaling model to use'
          },
          upscale_method: {
            type: 'select',
            default: 'lanczos',
            options: ['lanczos', 'nearest', 'bilinear', 'bicubic', 'area'],
            description: 'Upscaling interpolation method'
          },
          megapixels: {
            type: 'number',
            default: 5.0,
            min: 1.0,
            max: 20.0,
            step: 0.1,
            description: 'Target megapixels for final image'
          },
          enable_upscale: {
            type: 'boolean',
            default: true,
            description: 'Enable upscaling (if disabled, only enhancement is applied)'
          }
        },
        pricing: {
          costPerImage: 0.005,
          currency: 'USD'
        }
      }
    ]
  }

  async enhanceImage(
    request: EnhancementRequest,
    modelId: string
  ): Promise<EnhancementResponse> {
    try {
      // Validate request
      this.validateRequest(request)

      // Get model info
      const model = this.getModel(modelId)
      if (!model) {
        return this.createErrorResponse(`Model ${modelId} not found`)
      }

      console.log('🚀 RunningHub: Enhancement request received', {
        modelId,
        userId: request.userId,
        imageId: request.imageId,
        settings: request.settings
      })

      // Sanitize and validate settings with correct parameter mapping
      const settings = {
        prompt: request.settings.prompt || 'high quality, detailed, enhanced',
        steps: request.settings.steps || 10,
        guidance_scale: request.settings.guidance_scale || 3.5,
        denoise: request.settings.strength || request.settings.denoise || 0.3,
        sampler_name: this.mapSamplerName(request.settings.sampler_name) || 'dpmpp_2m',
        scheduler: this.mapSchedulerName(request.settings.scheduler) || 'sgm_uniform',
        seed: request.settings.seed,
        enable_upscale: request.settings.enable_upscale !== undefined ? request.settings.enable_upscale : true,
        upscaler: request.settings.upscaler || '4xRealWebPhoto_v4_dat2.pth'
      }
      
      // Validate parameter ranges
      if (settings.steps && (settings.steps < 1 || settings.steps > 50)) {
        return this.createErrorResponse('Steps must be between 1 and 50')
      }

      if (settings.guidance_scale && (settings.guidance_scale < 1 || settings.guidance_scale > 20)) {
        return this.createErrorResponse('Guidance scale must be between 1 and 20')
      }

      if (settings.seed && isNaN(parseInt(String(settings.seed)))) {
        return this.createErrorResponse('Seed must be a valid number')
      }

      if (settings.denoise && (settings.denoise < 0.1 || settings.denoise > 1)) {
        return this.createErrorResponse('Denoise strength must be between 0.1 and 1')
      }

      // Validate upscaler model selection
      const validUpscalers = ['4xRealWebPhoto_v4_dat2.pth', '4x_NMKD-Siax_200k.pth', '4x-UltraSharp.pth', 'RealESRGAN_x4plus.pth']
      if (settings.upscaler && !validUpscalers.includes(settings.upscaler)) {
        return this.createErrorResponse(`Invalid upscaler model. Must be one of: ${validUpscalers.join(', ')}`)
      }

      // Create ComfyUI task with RunningHub API
      const taskResponse = await this.createTask(request.imageUrl, settings)
      
      if (!taskResponse.success) {
        return this.createErrorResponse(taskResponse.error || 'Failed to create task')
      }

      // Poll for task completion
      const result = await this.pollTaskCompletion(taskResponse.taskId!)
      
      if (!result.success) {
        return this.createErrorResponse(result.error || 'Task failed')
      }

      console.log('✅ RunningHub: Enhancement completed successfully', {
        taskId: taskResponse.taskId,
        outputUrl: result.outputUrl
      })

      return {
        success: true,
        enhancedUrl: result.outputUrl,
        metadata: {
          modelVersion: model.version,
          processingTime: result.processingTime,
          settings,
          userId: request.userId,
          imageId: request.imageId,
          outputFormat: 'png',
          provider: this.getProviderName(),
          model: modelId,
          timestamp: Date.now(),
          details: {
            taskId: taskResponse.taskId,
            workflowId: '1965053107388432385'
          }
        }
      }

    } catch (error: unknown) {
      console.error('❌ RunningHub: Enhancement failed:', error)
      return this.createErrorResponse(
        formatErrorMessage(error)
      )
    }
  }

  private async createTask(imageUrl: string, settings: RunningHubSettings): Promise<{
    success: boolean
    taskId?: string
    error?: string
  }> {
    try {
      let processedImageUrl = imageUrl

      // Check if imageUrl is a base64 data URL and convert it
      if (imageUrl.startsWith('data:')) {
        console.log('RunningHub: Converting base64 image to public URL...')
        
        try {
          // Convert base64 to buffer for server-side upload
          const base64Data = imageUrl.split(',')[1]
          const mimeType = imageUrl.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
          const extension = mimeType.split('/')[1] || 'jpg'
          
          if (!base64Data) {
            return {
              success: false,
              error: 'Invalid base64 data URL'
            }
          }
          
          // Convert base64 to Buffer (Node.js compatible)
          const buffer = Buffer.from(base64Data, 'base64')
          
          // Create a server-side compatible file object
          const fileName = `enhancement-input.${extension}`
          const key = `uploads/${Date.now()}-${fileName}`
          
          // Upload directly using tebiClient (bypassing File requirement)
          const { default: tebiClient, tebiUtils } = await import('../../../lib/tebi')
          const bucketName = process.env.NEXT_PUBLIC_TEBI_BUCKET_NAME || 'sharpii-ai'
          const uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
            Metadata: {
              originalName: fileName,
             uploadedAt: new Date().toISOString(),
             category: 'uploads'
           }
         }
          
          await tebiClient.putObject(uploadParams).promise()
          
          // Generate the public URL
          const uploadResult = {
            key,
            url: tebiUtils.getFileUrl(key),
            size: buffer.length
          }
           
           if (!uploadResult.url) {
             return {
               success: false,
               error: 'Failed to upload image to storage service'
             }
           }
          
          processedImageUrl = uploadResult.url
          console.log('RunningHub: Successfully converted base64 to URL:', processedImageUrl)
        } catch (uploadError) {
          console.error('RunningHub: Failed to convert base64 image:', uploadError)
          return {
            success: false,
            error: 'Failed to process base64 image'
          }
        }
      }
      
      // Generate random seed if not provided
      const seed = settings.seed ? parseInt(String(settings.seed)) : Math.floor(Math.random() * 1000000000000000)
      
      console.log('🔗 RunningHub: Creating task with image URL:', processedImageUrl.substring(0, 100) + '...')
      
      // Simplified node mapping focusing on essential parameters
      const nodeInfoList = [
        {
          nodeId: '97', // LoadImage node - essential for input
          fieldName: 'image',
          fieldValue: processedImageUrl
        },
        {
          nodeId: '86', // CLIPTextEncode node for prompt
          fieldName: 'text',
          fieldValue: settings.prompt || 'high quality, detailed, enhanced'
        },
        {
          nodeId: '89', // RandomNoise node for seed
          fieldName: 'noise_seed',
          fieldValue: seed.toString()
        }
      ]

      // Add additional nodes carefully to avoid conflicts
      if (settings.steps) {
        nodeInfoList.push({
          nodeId: '90', // BasicScheduler node for steps
          fieldName: 'steps',
          fieldValue: String(settings.steps)
        })
      }

      if (settings.guidance_scale) {
        nodeInfoList.push({
          nodeId: '88', // FluxGuidance node for guidance scale
          fieldName: 'guidance',
          fieldValue: String(settings.guidance_scale)
        })
      }

      if (settings.denoise && settings.steps) {
        // Only add denoise if we also have steps (same node)
        nodeInfoList.push({
          nodeId: '90', // BasicScheduler node for denoise strength
          fieldName: 'denoise',
          fieldValue: String(settings.denoise)
        })
      }

      if (settings.sampler_name) {
        nodeInfoList.push({
          nodeId: '87', // KSamplerSelect node for sampler
          fieldName: 'sampler_name',
          fieldValue: settings.sampler_name
        })
      }

      if (settings.scheduler && settings.steps) {
        // Only add scheduler if we also have steps (same node)
        nodeInfoList.push({
          nodeId: '90', // BasicScheduler node for scheduler
          fieldName: 'scheduler',
          fieldValue: settings.scheduler
        })
      }

      // Add upscaler node mode settings if present
      if (settings.node_191_mode !== undefined) {
        nodeInfoList.push({
          nodeId: '191',
          fieldName: 'mode',
          fieldValue: String(settings.node_191_mode)
        })
      }
      
      if (settings.node_192_mode !== undefined) {
        nodeInfoList.push({
          nodeId: '192',
          fieldName: 'mode',
          fieldValue: String(settings.node_192_mode)
        })
      }
      
      if (settings.node_193_mode !== undefined) {
        nodeInfoList.push({
          nodeId: '193',
          fieldName: 'mode',
          fieldValue: String(settings.node_193_mode)
        })
      }

      console.log('🔍 RunningHub: Node mappings being sent:', JSON.stringify(nodeInfoList, null, 2))

      const requestPayload = {
        apiKey: this.apiKey,
        workflowId: '1965053107388432385', // Original workflow - try this first
        nodeInfoList,
        addMetadata: true
      }

      console.log('🔍 RunningHub: Trying primary workflow ID: 1965053107388432385')
      console.log('🔍 RunningHub: Node info list length:', nodeInfoList.length)

      console.log('🔍 RunningHub: API Request Details:', {
        url: `${this.baseUrl}/task/openapi/create`,
        method: 'POST',
        headers: {
          'Host': 'www.runninghub.ai',
          'Content-Type': 'application/json'
        },
        payloadSize: JSON.stringify(requestPayload).length,
        apiKeyLength: this.apiKey.length,
        workflowId: '1965053107388432385',
        nodeCount: nodeInfoList.length
      })

      let response: Response
      try {
        response = await fetch(`${this.baseUrl}/task/openapi/create`, {
          method: 'POST',
          headers: {
            'Host': 'www.runninghub.ai',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestPayload)
        })
        console.log('✅ RunningHub: Fetch successful, response status:', response.status)
      } catch (fetchError) {
        console.error('❌ RunningHub: Fetch failed with error:', fetchError)
        console.error('❌ RunningHub: Error details:', {
          name: fetchError instanceof Error ? fetchError.name : 'Unknown',
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          cause: fetchError instanceof Error ? fetchError.cause : undefined
        })
        throw new Error(`Network request failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`)
      }

      console.log('🔍 RunningHub: Task creation response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ RunningHub: Task creation failed:', errorText)
        throw new Error(`RunningHub API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ RunningHub: Task created successfully:', JSON.stringify(data, null, 2))

      if (data.code === 0 && data.data?.taskId) {
        // Check for node errors in promptTips
        if (data.data.promptTips) {
          try {
            const promptTips = JSON.parse(data.data.promptTips)
            if (promptTips.node_errors && Object.keys(promptTips.node_errors).length > 0) {
              console.log('⚠️ RunningHub: Node errors detected in workflow:', promptTips.node_errors)

              // Extract error details for better debugging
              const errorMessages: string[] = []
              for (const [nodeId, nodeError] of Object.entries(promptTips.node_errors as Record<string, any>)) {
                if (nodeError.errors && Array.isArray(nodeError.errors)) {
                  for (const error of nodeError.errors) {
                    errorMessages.push(`Node ${nodeId}: ${error.details || error.message || 'Unknown error'}`)
                  }
                }
              }

              console.log('🔍 RunningHub: Error details:', errorMessages)

              // Still continue with the task since it was created, but log the potential issues
              console.log('⚠️ RunningHub: Continuing with task despite node errors - outputs may be affected')
            }
          } catch (parseError) {
            console.log('⚠️ RunningHub: Could not parse promptTips:', parseError)
          }
        }

        return {
          success: true,
          taskId: data.data.taskId
        }
      } else {
        return {
          success: false,
          error: data.msg || 'Failed to create task'
        }
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error creating task'
      }
    }
  }

  private async pollTaskCompletion(taskId: string): Promise<{
    success: boolean
    outputUrl?: string
    processingTime?: number
    error?: string
  }> {
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    const pollInterval = 5000 // 5 seconds
    let attempts = 0
    const startTime = Date.now()

    while (attempts < maxAttempts) {
      try {
        // Check task status
        const statusResponse = await fetch(`${this.baseUrl}/task/openapi/status`, {
          method: 'POST',
          headers: {
            'Host': 'www.runninghub.ai',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            apiKey: this.apiKey,
            taskId
          })
        })

        const statusData = await statusResponse.json()
        
        console.log('🔍 RunningHub: Polling attempt', attempts + 1, 'Status response:', JSON.stringify(statusData, null, 2))
        
        if (statusData.code === 0) {
          const status = statusData.data
          
          console.log('🔍 RunningHub: Task status:', status)
          
          if (status === 'SUCCESS') {
            console.log('✅ RunningHub: Task completed successfully, waiting before fetching outputs...')
            // Wait longer for outputs to be fully processed
            await new Promise(resolve => setTimeout(resolve, 5000))
            
            console.log('🔍 RunningHub: Now fetching outputs...')
            
            // Try fetching outputs multiple times with increasing delays
            let outputData: unknown = null
            let outputAttempts = 0
            const maxOutputAttempts = 3
            
            while (outputAttempts < maxOutputAttempts) {
              const outputResponse = await fetch(`${this.baseUrl}/task/openapi/outputs`, {
                method: 'POST',
                headers: {
                  'Host': 'www.runninghub.ai',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  apiKey: this.apiKey,
                  taskId
                })
              })

              outputData = await outputResponse.json()
              
              console.log(`🔍 RunningHub: Output attempt ${outputAttempts + 1}/${maxOutputAttempts}:`, JSON.stringify(outputData, null, 2))
              
              // If we have outputs, break out of the loop
              if (isRunningHubOutputsResponse(outputData) && Array.isArray(outputData.data) && outputData.code === 0 && outputData.data.length > 0) {
                 console.log('✅ RunningHub: Found outputs on attempt', outputAttempts + 1)
                 break
               }
              
              outputAttempts++
              if (outputAttempts < maxOutputAttempts) {
                console.log(`⏳ RunningHub: No outputs yet, waiting ${3000 * outputAttempts}ms before retry...`)
                await new Promise(resolve => setTimeout(resolve, 3000 * outputAttempts))
              }
            }
            
            if (isRunningHubOutputsResponse(outputData) && Array.isArray(outputData.data) && outputData.code === 0 && outputData.data.length > 0) {
              console.log('🔍 RunningHub: Output data found, checking for final output node...')
              console.log('🔍 RunningHub: Available outputs:', outputData.data.map((o) => ({ nodeId: o.nodeId, hasFileUrl: !!o.fileUrl })))
              
              // Log all available outputs for debugging
              console.log('🔍 RunningHub: All available outputs:', outputData.data.map(o => ({
                nodeId: o.nodeId,
                hasFileUrl: !!o.fileUrl,
                fileUrl: o.fileUrl ? o.fileUrl.substring(0, 100) + '...' : 'No URL'
              })))

              // Look for actual output node IDs from this workflow (prioritize common output nodes)
              const priorityNodeIds = ['102', '136', '144', '138', '143'] // Main workflow outputs
              const fallbackNodeIds = ['99', '100', '101', '103', '104', '105'] // Common ComfyUI output nodes
              const allPossibleNodeIds = [...priorityNodeIds, ...fallbackNodeIds]

              let finalOutput: RunningHubOutputItem | undefined

              // First try priority nodes
              for (const nodeId of priorityNodeIds) {
                finalOutput = outputData.data.find((output) => String(output.nodeId) === String(nodeId) && !!output.fileUrl)
                if (finalOutput) {
                  console.log(`✅ RunningHub: Found output from priority node ${nodeId}:`, finalOutput.fileUrl)
                  break
                }
              }

              // Then try fallback nodes
              if (!finalOutput) {
                for (const nodeId of fallbackNodeIds) {
                  finalOutput = outputData.data.find((output) => String(output.nodeId) === String(nodeId) && !!output.fileUrl)
                  if (finalOutput) {
                    console.log(`✅ RunningHub: Found output from fallback node ${nodeId}:`, finalOutput.fileUrl)
                    break
                  }
                }
              }

              // If no specific node found, try to find any output with a file URL
              if (!finalOutput) {
                finalOutput = outputData.data.find((output) => !!output.fileUrl)
                if (finalOutput) {
                  console.log('✅ RunningHub: Found any output from node', finalOutput.nodeId, ':', finalOutput.fileUrl)
                }
              }
              
              if (finalOutput && finalOutput.fileUrl) {
                return {
                  success: true,
                  outputUrl: finalOutput.fileUrl,
                  processingTime: Date.now() - startTime
                }
              }
              
              console.log('❌ RunningHub: No valid output found in response')
              console.log('🔍 RunningHub: All outputs:', JSON.stringify(outputData.data, null, 2))
              return {
                success: false,
                error: 'No valid output found in response',
                processingTime: Date.now() - startTime
              }
            } else {
              // Check if we have a valid response with empty data
              if (isRunningHubOutputsResponse(outputData) && Array.isArray(outputData.data) && outputData.code === 0) {
                console.log('❌ RunningHub: Valid response but empty output data')
                console.log('🔍 RunningHub: Response details:', {
                  code: outputData.code,
                  msg: outputData.msg,
                  dataLength: outputData.data.length,
                  dataItems: outputData.data
                })
                return {
                  success: false,
                  error: 'Workflow completed successfully but produced no outputs. This may indicate a workflow configuration issue.',
                  processingTime: Date.now() - startTime
                }
              } else {
                console.log('❌ RunningHub: Invalid output response structure')
                try {
                  console.log('🔍 RunningHub: Raw output response:', JSON.stringify(outputData))
                } catch {
                  console.log('🔍 RunningHub: Could not stringify output response')
                }
                return {
                  success: false,
                  error: 'Invalid output response structure - unexpected response format',
                  processingTime: Date.now() - startTime
                }
              }
            }
          } else if (status === 'FAILED') {
            console.log('❌ RunningHub: Task failed on RunningHub')
            return {
              success: false,
              error: 'Task failed on RunningHub'
            }
          } else {
            console.log('⏳ RunningHub: Task still processing, status:', status)
          }
          // Continue polling for QUEUED or RUNNING status
        }

        attempts++
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval))
        }
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Error polling task status'
        }
      }
    }

    return {
      success: false,
      error: 'Task timeout - processing took too long'
    }
  }

  protected validateRequest(request: EnhancementRequest): void {
    if (!request.imageUrl) {
      throw new Error('Image URL is required')
    }
    if (!request.userId) {
      throw new Error('User ID is required')
    }
    if (!request.imageId) {
      throw new Error('Image ID is required')
    }
  }

  protected getModel(modelId: string): ModelInfo | undefined {
    return this.models.find(model => model.id === modelId)
  }

  private mapSamplerName(samplerName: string | undefined): string {
    if (!samplerName) return 'dpmpp_2m'

    // Map common sampler names to RunningHub valid values
    const samplerMap: Record<string, string> = {
      'DPM++ 2M': 'dpmpp_2m',
      'dpmpp_2m': 'dpmpp_2m',
      'DPM++ 2M Karras': 'dpmpp_2m',
      'Euler': 'euler',
      'euler': 'euler',
      'Euler a': 'euler_ancestral',
      'euler_ancestral': 'euler_ancestral',
      'Heun': 'heun',
      'heun': 'heun',
      'DPM2': 'dpm_2',
      'dpm_2': 'dpm_2',
      'DPM2 a': 'dpm_2_ancestral',
      'dpm_2_ancestral': 'dpm_2_ancestral',
      'LMS': 'lms',
      'lms': 'lms',
      'DPM++ SDE': 'dpmpp_sde',
      'dpmpp_sde': 'dpmpp_sde',
      'DPM++ 2S a': 'dpmpp_2s_ancestral',
      'dpmpp_2s_ancestral': 'dpmpp_2s_ancestral'
    }

    return samplerMap[samplerName] || 'dpmpp_2m'
  }

  private mapSchedulerName(schedulerName: string | undefined): string {
    if (!schedulerName) return 'sgm_uniform'

    // Map common scheduler names to RunningHub valid values
    const schedulerMap: Record<string, string> = {
      'DPM++ 2M': 'sgm_uniform', // DPM++ 2M is a sampler, not scheduler
      'Normal': 'normal',
      'normal': 'normal',
      'Karras': 'karras',
      'karras': 'karras',
      'Exponential': 'exponential',
      'exponential': 'exponential',
      'Simple': 'simple',
      'simple': 'simple',
      'SGM Uniform': 'sgm_uniform',
      'sgm_uniform': 'sgm_uniform',
      'DDIM Uniform': 'ddim_uniform',
      'ddim_uniform': 'ddim_uniform',
      'Beta': 'beta',
      'beta': 'beta',
      'linear_quadratic': 'linear_quadratic',
      'kl_optimal': 'kl_optimal',
      'ays': 'ays',
      'ays+': 'ays+',
      'ays_30': 'ays_30',
      'ays_30+': 'ays_30+'
    }

    return schedulerMap[schedulerName] || 'sgm_uniform'
  }

  protected createErrorResponse(error: string): EnhancementResponse {
    return {
      success: false,
      error,
      message: 'RunningHub enhancement failed'
    }
  }
}