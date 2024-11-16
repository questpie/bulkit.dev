export function extractPathExt(path: string): string {
  const matches = path.match(/\.([^./\\]+)$/)
  return matches ? `.${matches[1]}` : ''
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function toKebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^[A-Z]/, (c) => c.toLowerCase())
}

export function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}
