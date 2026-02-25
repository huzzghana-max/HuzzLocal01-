/**
 * Image Utilities
 * Handles image URL normalization and processing
 */

import { API_CONFIG } from '../config/api.config'

/**
 * Normalizes an image path to a full URL
 * Handles various formats (relative, absolute, URLs)
 */
export const normalizeImageUrl = (imagePath?: string): string => {
  if (!imagePath) return ''

  // Already a full URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // Relative path to uploads
  const apiHost = API_CONFIG.getApiHost()

  if (imagePath.startsWith('/uploads/')) {
    return `${apiHost}${imagePath}`
  }

  if (imagePath.startsWith('uploads/')) {
    return `${apiHost}/${imagePath}`
  }

  // Assume it's an absolute path from server
  if (imagePath.startsWith('/')) {
    return `${apiHost}${imagePath}`
  }

  // Default: assume uploads directory
  return `${apiHost}/uploads/${imagePath}`
}

/**
 * Gets a cached profile image URL from localStorage
 * Useful for reducing API calls
 */
export const getCachedProfileImage = (email?: string): string => {
  if (!email) return ''
  return localStorage.getItem(`profileImage:${email}`) || ''
}

/**
 * Caches a profile image URL in localStorage
 */
export const cacheProfileImage = (email: string, imageUrl: string): void => {
  if (email && imageUrl) {
    localStorage.setItem(`profileImage:${email}`, imageUrl)
  }
}

/**
 * Clears cached profile image from localStorage
 */
export const clearCachedProfileImage = (email: string): void => {
  localStorage.removeItem(`profileImage:${email}`)
}

/**
 * Generates a placeholder image URL
 * Can use services like Placeholder.com or Gravatar
 */
export const getPlaceholderImageUrl = (initials?: string): string => {
  // Using a simple placeholder with initials
  const encoded = encodeURIComponent(initials || 'U')
  return `https://ui-avatars.com/api/?name=${encoded}&background=random&color=fff&size=150`
}

/**
 * Validates if a file is an image
 */
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  return validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024 // 5MB max
}

/**
 * Gets the error message for invalid image files
 */
export const getImageValidationError = (file: File): string | null => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  if (!validTypes.includes(file.type)) {
    return 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)'
  }

  const maxSizeMB = 5
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `Image size must be less than ${maxSizeMB}MB`
  }

  return null
}

export default {
  normalizeImageUrl,
  getCachedProfileImage,
  cacheProfileImage,
  clearCachedProfileImage,
  getPlaceholderImageUrl,
  isValidImageFile,
  getImageValidationError,
}
