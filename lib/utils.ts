import type { ClassValue } from 'clsx'
import type { Coord } from './types'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Coordinate utilities
export function coordToKey(coord: Coord): string {
  return `${coord[0]},${coord[1]}`
}

export function keyToCoord(key: string): Coord {
  const [r, c] = key.split(',').map(Number)
  return [r, c]
}

export function coordsEqual(a: Coord, b: Coord): boolean {
  return a[0] === b[0] && a[1] === b[1]
}
