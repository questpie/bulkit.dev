import type { FolderItemType } from '@bulkit/shared/constants/db.constants'

/**
 * Generate a breadcrumb path string from breadcrumb items
 */
export function generateBreadcrumbPath(
  breadcrumbs: Array<{ name: string; isRoot: boolean }>
): string {
  return breadcrumbs.map((crumb) => (crumb.isRoot ? 'Root' : crumb.name)).join(' / ')
}

/**
 * Validate folder name
 */
export function validateFolderName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Folder name cannot be empty' }
  }

  if (name.length > 255) {
    return { isValid: false, error: 'Folder name cannot exceed 255 characters' }
  }

  // Check for invalid characters (similar to file system restrictions)
  const invalidChars = /[<>:"/\\|?*]/
  const hasControlChars = name.split('').some((char) => char.charCodeAt(0) <= 31)

  if (invalidChars.test(name) || hasControlChars) {
    return { isValid: false, error: 'Folder name contains invalid characters' }
  }

  // Reserved names
  const reservedNames = [
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
    'COM6',
    'COM7',
    'COM8',
    'COM9',
    'LPT1',
    'LPT2',
    'LPT3',
    'LPT4',
    'LPT5',
    'LPT6',
    'LPT7',
    'LPT8',
    'LPT9',
  ]
  if (reservedNames.includes(name.toUpperCase())) {
    return { isValid: false, error: 'Folder name is reserved' }
  }

  return { isValid: true }
}

/**
 * Get the appropriate file extension for different item types
 */
export function getItemTypeExtension(itemType: FolderItemType, subType?: string): string {
  switch (itemType) {
    case 'post':
      switch (subType) {
        case 'story':
          return '.story'
        case 'reel':
          return '.reel'
        case 'thread':
          return '.thread'
        default:
          return '.post'
      }
    case 'knowledge':
      return '.md'
    case 'resource':
      return '' // Resources keep their original extension
    default:
      return ''
  }
}

/**
 * Check if an item can be moved to a folder (basic validation)
 */
export function canMoveItemToFolder(
  itemType: FolderItemType,
  targetFolderId: string | null
): { canMove: boolean; reason?: string } {
  // All item types can be moved to any folder or root
  // This could be extended with more complex business rules later
  return { canMove: true }
}

/**
 * Generate a unique display name if there's a conflict
 */
export function generateUniqueDisplayName(baseName: string, existingNames: string[]): string {
  if (!existingNames.includes(baseName)) {
    return baseName
  }

  let counter = 1
  let candidateName = `${baseName} (${counter})`

  while (existingNames.includes(candidateName)) {
    counter++
    candidateName = `${baseName} (${counter})`
  }

  return candidateName
}

/**
 * Extract base name and extension from display name
 */
export function parseDisplayName(displayName: string): { baseName: string; extension: string } {
  const lastDotIndex = displayName.lastIndexOf('.')

  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return { baseName: displayName, extension: '' }
  }

  return {
    baseName: displayName.substring(0, lastDotIndex),
    extension: displayName.substring(lastDotIndex),
  }
}

/**
 * Sort folder items for consistent ordering
 */
export function sortFolderContents<T extends { displayName: string; order?: number }>(
  items: T[]
): T[] {
  return items.sort((a, b) => {
    // First sort by order if available
    if (a.order !== undefined && b.order !== undefined) {
      if (a.order !== b.order) {
        return a.order - b.order
      }
    }

    // Then by display name alphabetically
    return a.displayName.localeCompare(b.displayName, undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  })
}
