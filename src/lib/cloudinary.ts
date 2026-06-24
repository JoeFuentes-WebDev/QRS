import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export function assertCloudinaryConfigured(): void {
  const missing: string[] = []
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim()) {
    missing.push('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME')
  }
  if (!process.env.CLOUDINARY_API_KEY?.trim()) {
    missing.push('CLOUDINARY_API_KEY')
  }
  if (!process.env.CLOUDINARY_API_SECRET?.trim()) {
    missing.push('CLOUDINARY_API_SECRET')
  }
  if (missing.length > 0) {
    throw new Error(
      `Cloudinary is not configured. Set ${missing.join(', ')} in .env.local`
    )
  }
}

function safePublicId(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, '')
  const sanitized = base.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60)
  return `${sanitized || 'upload'}_${Date.now()}`
}

export type UploadResult = {
  url: string
  publicId: string
}

function uploadImage(
  file: Buffer,
  filename: string,
  folder: string
): Promise<UploadResult> {
  assertCloudinaryConfigured()

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: safePublicId(filename),
        overwrite: true,
        transformation: [
          { width: 800, height: 800, crop: 'fill', gravity: 'center' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(
            new Error(
              error instanceof Error ? error.message : 'Cloudinary upload failed'
            )
          )
        } else {
          resolve({ url: result!.secure_url, publicId: result!.public_id })
        }
      }
    )
    uploadStream.end(file)
  })
}

export async function uploadProductImage(
  sellerId: string,
  file: Buffer,
  filename: string
): Promise<UploadResult> {
  return uploadImage(file, filename, `qrs/${sellerId}/products`)
}

export async function uploadHeroImage(
  sellerId: string,
  file: Buffer,
  filename: string
): Promise<UploadResult> {
  return uploadImage(file, filename, `qrs/${sellerId}/hero`)
}

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

export { cloudinary }

export type CloudinarySignPayload = {
  signature: string
  timestamp: number
  cloudName: string
  apiKey: string
  folder: string
}

export function createUploadSignature(folder: string): CloudinarySignPayload {
  assertCloudinaryConfigured()

  const timestamp = Math.round(Date.now() / 1000)
  const params = { timestamp, folder }
  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  )

  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!.trim(),
    apiKey: process.env.CLOUDINARY_API_KEY!.trim(),
    folder,
  }
}
