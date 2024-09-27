export function extractPathExt(path: string): string {
  const ext = path.split('.').pop()
  return ext ? `.${ext}` : ''
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
