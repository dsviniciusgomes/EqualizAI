export function getApiUrl(path: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim()
  const baseUrl = configuredUrl || (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '')

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL não está configurada.')
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(baseUrl)
  } catch {
    throw new Error('NEXT_PUBLIC_API_URL deve ser uma URL válida.')
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.search || parsedUrl.hash) {
    throw new Error('NEXT_PUBLIC_API_URL deve conter somente a URL base da API.')
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
  return `${normalizedBaseUrl}/${path.replace(/^\/+/, '')}`
}
