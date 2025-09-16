import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3'
import type { PutObjectCommandInput, GetObjectCommandInput, DeleteObjectCommandInput, ListObjectsV2CommandInput, HeadObjectCommandInput } from '@aws-sdk/client-s3'

// Tebi.io S3-Compatible Client Implementation using AWS SDK v3
interface TebiConfig {
  endpoint: string
  region?: string
  bucketName: string
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
}

class TebiClient {
  private s3Client: S3Client
  private bucketName: string

  constructor(config: TebiConfig) {
    const endpoint = config.endpoint
    const accessKeyId = config.credentials.accessKeyId
    const secretAccessKey = config.credentials.secretAccessKey
    const region = config.region || 'us-east-1'
    
    this.bucketName = config.bucketName
    
    // Initialize AWS S3 Client with Tebi.io endpoint
    this.s3Client = new S3Client({
      endpoint: endpoint,
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      forcePathStyle: true, // Required for S3-compatible services
      // Browser-specific configuration to handle streaming issues
      requestHandler: {
        requestTimeout: 30000,
        // Disable streaming for browser compatibility
        disableRequestCompression: true,
        // Use XMLHttpRequest for better browser compatibility
        httpsAgent: false,
      } as unknown as S3Client['config']['requestHandler'],
      // Disable problematic features for browser compatibility
      disableS3ExpressSessionAuth: true,
      // Disable chunked encoding for browser compatibility
      useAccelerateEndpoint: false,
      // Additional browser compatibility settings
      maxAttempts: 3,
    })
    
    console.log('TebiClient initialized with AWS SDK:', {
      endpoint: endpoint,
      accessKeyId: accessKeyId ? '***' + accessKeyId.slice(-4) : 'none',
      region: region,
      bucketName: this.bucketName
    })
  }

  // Upload a file to Tebi.io
  putObject(params: PutObjectCommandInput) {
    return {
      promise: async () => {
        try {
          console.log('Uploading file:', {
            bucket: params.Bucket,
            key: params.Key,
            contentType: params.ContentType
          })

          // Convert Blob/File to Uint8Array for better browser compatibility
          let body = params.Body as unknown
          if (body instanceof Blob) {
            const ab = await body.arrayBuffer()
            body = new Uint8Array(ab)
          }

          const command = new PutObjectCommand({
            Bucket: params.Bucket,
            Key: params.Key,
            Body: body as PutObjectCommandInput['Body'],
            ContentType: params.ContentType,
            Metadata: params.Metadata || {},
          })

          const result = await this.s3Client.send(command)
          console.log('Upload successful:', result)
          return result
        } catch (error) {
          console.error('Upload failed:', error)
          throw error
        }
      }
    }
  }

  // Get an object from Tebi.io
  getObject(params: GetObjectCommandInput) {
    return {
      promise: async () => {
        try {
          const command = new GetObjectCommand({
            Bucket: params.Bucket,
            Key: params.Key,
          })

          const result = await this.s3Client.send(command)
          return result
        } catch (error) {
          console.error('Get object failed:', error)
          throw error
        }
      }
    }
  }

  // Delete an object from Tebi.io
  deleteObject(params: DeleteObjectCommandInput) {
    return {
      promise: async () => {
        try {
          const command = new DeleteObjectCommand({
            Bucket: params.Bucket,
            Key: params.Key,
          })

          const result = await this.s3Client.send(command)
          return result
        } catch (error) {
          console.error('Delete object failed:', error)
          throw error
        }
      }
    }
  }

  // Copy an object within Tebi.io
  copyObject(params: { Bucket: string; CopySource: string; Key: string }) {
    return {
      promise: async () => {
        try {
          const command = new CopyObjectCommand({
            Bucket: params.Bucket,
            CopySource: params.CopySource,
            Key: params.Key,
          })
          const result = await this.s3Client.send(command)
          return result
        } catch (error) {
          console.error('Copy object failed:', error)
          throw error
        }
      }
    }
  }

  // Get object metadata
  headObject(params: HeadObjectCommandInput) {
    return {
      promise: async () => {
        try {
          const command = new HeadObjectCommand({
            Bucket: params.Bucket,
            Key: params.Key,
          })

          const result = await this.s3Client.send(command)
          return result
        } catch (error) {
          console.error('Head object failed:', error)
          throw error
        }
      }
    }
  }

  // List objects in bucket
  listObjectsV2(params: ListObjectsV2CommandInput) {
    return {
      promise: async () => {
        try {
          const command = new ListObjectsV2Command({
            Bucket: params.Bucket,
            Prefix: params.Prefix,
            MaxKeys: params.MaxKeys,
            ContinuationToken: params.ContinuationToken,
          })

          const result = await this.s3Client.send(command)
          return result
        } catch (error) {
          console.error('List objects failed:', error)
          throw error
        }
      }
    }
  }

  // Minimal getSignedUrl placeholder that returns a direct URL
  async getSignedUrl(
    operation: 'putObject' | 'getObject',
    params: { Bucket: string; Key: string; ContentType?: string; Expires?: number }
  ): Promise<string> {
    const endpoint = process.env.NEXT_PUBLIC_TEBI_ENDPOINT || 'https://s3.tebi.io'
    return `${endpoint}/${this.bucketName}/${params.Key}`
  }
}

// Create and export Tebi client instance
const tebiClient = new TebiClient({
  endpoint: process.env.NEXT_PUBLIC_TEBI_ENDPOINT || 'https://s3.tebi.io',
  region: process.env.NEXT_PUBLIC_TEBI_REGION || 'us-east-1',
  bucketName: process.env.NEXT_PUBLIC_TEBI_BUCKET_NAME || '',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_TEBI_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_TEBI_SECRET_ACCESS_KEY || '',
  },
})

// File categories for organization
export const FILE_CATEGORIES = {
  UPLOADS: 'uploads',
  ENHANCED: 'enhanced',
  THUMBNAILS: 'thumbnails',
  TEMP: 'temp',
  ASSETS: 'assets',
  USER_AVATARS: 'avatars',
  GALLERY: 'gallery',
  WEBSITE: 'website', // Website-specific files
  IMAGES: 'images',   // General website images
  DOCUMENTS: 'documents', // Website documents and content
  SHARPII: 'sharpii', // Sharpii.ai specific content
} as const

export type FileCategory = typeof FILE_CATEGORIES[keyof typeof FILE_CATEGORIES]

// File upload utilities
export const tebiUtils = {
  // Generate unique filename
  generateFilename: (originalName: string, prefix?: string): string => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const extension = originalName.split('.').pop()
    const prefixPath = prefix ? `${prefix}/` : ''
    return `${prefixPath}${timestamp}-${random}.${extension}`
  },

  // Get file URL from key
  getFileUrl: (key: string): string => {
    const endpoint = process.env.NEXT_PUBLIC_TEBI_ENDPOINT || 'https://s3.tebi.io'
    const bucket = process.env.NEXT_PUBLIC_TEBI_BUCKET_NAME || ''
    return `${endpoint}/${bucket}/${key}`
  },

  // Get file key from URL
  getFileKey: (url: string): string => {
    try {
      const endpoint = process.env.NEXT_PUBLIC_TEBI_ENDPOINT || 'https://s3.tebi.io'
      const bucket = process.env.NEXT_PUBLIC_TEBI_BUCKET_NAME || ''
      const prefix = `${endpoint}/${bucket}/`
      return url.startsWith(prefix) ? url.slice(prefix.length) : url
    } catch {
      return url
    }
  },

  // Validate file type
  isValidFileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type)
  },
}

export default tebiClient
