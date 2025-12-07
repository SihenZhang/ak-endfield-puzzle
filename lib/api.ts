import type { PlacedPiece, Puzzle } from './types'

export async function solvePuzzle(request: Puzzle): Promise<PlacedPiece[]> {
  try {
    const response = await fetch('/api/solve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => null)
      const detail
        = typeof error?.detail === 'string'
          ? error.detail
          : Array.isArray(error?.detail)
            ? error.detail
                .map((item: unknown) => {
                  if (typeof item === 'string')
                    return item
                  if (typeof item === 'object' && item !== null) {
                    const { msg, message } = item as { msg?: string, message?: string }
                    if (msg)
                      return msg
                    if (message)
                      return message
                  }
                  return JSON.stringify(item)
                })
                .join('; ')
            : `HTTP ${response.status}: ${response.statusText}`

      throw new Error(detail || '求解失败')
    }

    const placements = await response.json() as unknown

    if (!Array.isArray(placements))
      throw new Error('响应格式不正确')

    return placements as PlacedPiece[]
  }
  catch (error) {
    throw new Error(error instanceof Error ? error.message : '网络错误')
  }
}

export async function parsePuzzle(
  file: File,
  options?: {
    onProgress?: (percent: number) => void
  },
): Promise<Puzzle> {
  const formData = new FormData()
  formData.append('file', file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && options?.onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100)
        options.onProgress(percent)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const puzzle = JSON.parse(xhr.responseText) as unknown
          if (!puzzle || typeof puzzle !== 'object') {
            reject(new Error('响应格式不正确'))
            return
          }
          resolve(puzzle as Puzzle)
        }
        catch {
          reject(new Error('响应格式不正确'))
        }
      }
      else {
        try {
          const error = JSON.parse(xhr.responseText)
          const detail
            = typeof error?.detail === 'string'
              ? error.detail
              : Array.isArray(error?.detail)
                ? error.detail
                    .map((item: unknown) => {
                      if (typeof item === 'string')
                        return item
                      if (typeof item === 'object' && item !== null) {
                        const { msg, message } = item as { msg?: string, message?: string }
                        if (msg)
                          return msg
                        if (message)
                          return message
                      }
                      return JSON.stringify(item)
                    })
                    .join('; ')
                : `HTTP ${xhr.status}: ${xhr.statusText}`

          reject(new Error(detail || '解析失败'))
        }
        catch {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
        }
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('网络错误'))
    })

    xhr.addEventListener('abort', () => {
      reject(new Error('上传已取消'))
    })

    xhr.open('POST', '/api/parse')
    xhr.send(formData)
  })
}
