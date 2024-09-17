export function extractPathExt(path: string): string {
  const ext = path.split('.').pop()
  return ext ? `.${ext}` : ''
}
