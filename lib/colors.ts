// Color palette configuration for the puzzle

export interface ColorInfo {
  id: number
  name: string
  hex: string
  bgClass: string
  textClass: string
  ringClass: string
  borderClass: string
}

export const COLORS: ColorInfo[] = [
  {
    id: 0,
    name: '绿色',
    hex: '#22c55e',
    bgClass: 'bg-green-500',
    textClass: 'text-white',
    ringClass: 'ring-green-500',
    borderClass: 'border-green-500',
  },
  {
    id: 1,
    name: '蓝色',
    hex: '#3b82f6',
    bgClass: 'bg-blue-500',
    textClass: 'text-white',
    ringClass: 'ring-blue-500',
    borderClass: 'border-blue-500',
  },
  {
    id: 2,
    name: '红色',
    hex: '#ef4444',
    bgClass: 'bg-red-500',
    textClass: 'text-white',
    ringClass: 'ring-red-500',
    borderClass: 'border-red-500',
  },
  {
    id: 3,
    name: '黄色',
    hex: '#eab308',
    bgClass: 'bg-yellow-500',
    textClass: 'text-white',
    ringClass: 'ring-yellow-500',
    borderClass: 'border-yellow-500',
  },
  {
    id: 4,
    name: '紫色',
    hex: '#a855f7',
    bgClass: 'bg-purple-500',
    textClass: 'text-white',
    ringClass: 'ring-purple-500',
    borderClass: 'border-purple-500',
  },
  {
    id: 5,
    name: '橙色',
    hex: '#f97316',
    bgClass: 'bg-orange-500',
    textClass: 'text-white',
    ringClass: 'ring-orange-500',
    borderClass: 'border-orange-500',
  },
] as const

export const DEFAULT_COLOR_ID = 0 // Green

export function getColorById(id: number): ColorInfo {
  return COLORS.find(c => c.id === id) || COLORS[0]
}
