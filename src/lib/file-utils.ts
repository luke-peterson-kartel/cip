import type { ReactNode } from 'react'

/**
 * Format bytes to human-readable file size
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB", "256 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Check if a MIME type is an image
 * @param mimeType - MIME type string
 * @returns true if the MIME type is an image
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

/**
 * Check if a MIME type is a video
 * @param mimeType - MIME type string
 * @returns true if the MIME type is a video
 */
export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

/**
 * Check if a MIME type is a PDF
 * @param mimeType - MIME type string
 * @returns true if the MIME type is a PDF
 */
export function isPDF(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

/**
 * Check if a MIME type is a document
 * @param mimeType - MIME type string
 * @returns true if the MIME type is a document
 */
export function isDocument(mimeType: string): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/rtf'
  ]
  return documentTypes.includes(mimeType)
}

/**
 * Check if a MIME type is an archive
 * @param mimeType - MIME type string
 * @returns true if the MIME type is an archive
 */
export function isArchive(mimeType: string): boolean {
  const archiveTypes = [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip'
  ]
  return archiveTypes.includes(mimeType)
}

/**
 * Get a file type icon name based on MIME type
 * Returns a string that can be used to select the appropriate icon
 * @param mimeType - MIME type string
 * @returns Icon type identifier
 */
export function getFileTypeIcon(mimeType: string): string {
  if (isImage(mimeType)) return 'image'
  if (isVideo(mimeType)) return 'video'
  if (isPDF(mimeType)) return 'pdf'
  if (isArchive(mimeType)) return 'archive'
  if (mimeType.startsWith('text/') || mimeType.includes('csv')) return 'text'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'word'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'powerpoint'
  return 'file'
}

/**
 * Validate if a file matches the accepted file types
 * @param file - File object to validate
 * @param acceptedTypes - Array of accepted MIME types or extensions (e.g., ['image/*', '.pdf', 'video/mp4'])
 * @returns true if the file is valid
 */
export function validateFileType(file: File, acceptedTypes: string[]): boolean {
  if (!acceptedTypes || acceptedTypes.length === 0) return true

  const fileMimeType = file.type
  const fileName = file.name.toLowerCase()

  return acceptedTypes.some(type => {
    // Check for wildcard MIME types (e.g., 'image/*')
    if (type.includes('*')) {
      const baseType = type.split('/')[0]
      return fileMimeType.startsWith(baseType + '/')
    }

    // Check for file extensions (e.g., '.pdf')
    if (type.startsWith('.')) {
      return fileName.endsWith(type.toLowerCase())
    }

    // Check for exact MIME type match
    return fileMimeType === type
  })
}

/**
 * Validate file size
 * @param file - File object to validate
 * @param maxSizeInMB - Maximum file size in megabytes
 * @returns true if the file size is valid
 */
export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return file.size <= maxSizeInBytes
}

/**
 * Generate a thumbnail for an image file
 * @param file - Image file
 * @param maxWidth - Maximum width of thumbnail (default: 200)
 * @param maxHeight - Maximum height of thumbnail (default: 200)
 * @returns Promise resolving to data URL of the thumbnail
 */
export async function generateThumbnail(
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isImage(file.type)) {
      reject(new Error('File is not an image'))
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        // Calculate thumbnail dimensions while maintaining aspect ratio
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert to data URL
        const thumbnail = canvas.toDataURL(file.type)
        resolve(thumbnail)
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Generate a thumbnail for a video file
 * @param file - Video file
 * @param timeInSeconds - Time in seconds to capture thumbnail (default: 1)
 * @param maxWidth - Maximum width of thumbnail (default: 200)
 * @param maxHeight - Maximum height of thumbnail (default: 200)
 * @returns Promise resolving to data URL of the thumbnail
 */
export async function generateVideoThumbnail(
  file: File,
  timeInSeconds: number = 1,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isVideo(file.type)) {
      reject(new Error('File is not a video'))
      return
    }

    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeInSeconds, video.duration)
    }

    video.onseeked = () => {
      // Calculate thumbnail dimensions while maintaining aspect ratio
      let width = video.videoWidth
      let height = video.videoHeight

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      // Create canvas and draw video frame
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(video, 0, 0, width, height)

      // Convert to data URL
      const thumbnail = canvas.toDataURL('image/jpeg', 0.85)
      resolve(thumbnail)

      // Clean up
      URL.revokeObjectURL(video.src)
    }

    video.onerror = () => {
      reject(new Error('Failed to load video'))
      URL.revokeObjectURL(video.src)
    }

    video.src = URL.createObjectURL(file)
  })
}

/**
 * Get file extension from filename
 * @param filename - Name of the file
 * @returns File extension (without dot) or empty string
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1 || lastDot === filename.length - 1) return ''
  return filename.substring(lastDot + 1).toLowerCase()
}

/**
 * Get file name without extension
 * @param filename - Name of the file
 * @returns File name without extension
 */
export function getFileNameWithoutExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return filename
  return filename.substring(0, lastDot)
}

/**
 * Read file as text
 * @param file - File to read
 * @returns Promise resolving to file content as string
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

/**
 * Read file as data URL
 * @param file - File to read
 * @returns Promise resolving to file content as data URL
 */
export async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}
