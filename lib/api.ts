import type { Puzzle, SolveResponse } from './types'

export async function solvePuzzle(request: Puzzle): Promise<SolveResponse> {
  try {
    const response = await fetch('/api/solve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      return {
        success: false,
        message: error.message || `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    return await response.json()
  }
  catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error',
    }
  }
}
