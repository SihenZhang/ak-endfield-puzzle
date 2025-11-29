'use client'

import type { ColorRequirement } from '@/lib/types'
import { HelpCircleIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { COLORS } from '@/lib/colors'
import { cn } from '@/lib/utils'

interface RequirementEditorProps {
  requirement: ColorRequirement
  maxCount: number
  lockedCounts?: ColorRequirement
  onChange: (requirement: ColorRequirement) => void
}

const EMPTY_LOCKED_COUNTS: ColorRequirement = {}

export function RequirementEditor({
  requirement,
  maxCount,
  lockedCounts = EMPTY_LOCKED_COUNTS,
  onChange,
}: RequirementEditorProps) {
  // 计算当前所有需求的总和
  const totalUsed = useMemo(() => {
    return Object.values(requirement).reduce((sum, count) => sum + count, 0)
  }, [requirement])

  // 剩余可用数量
  const remaining = maxCount - totalUsed

  const handleChange = (colorId: number, value: number) => {
    // 确保不能低于锁定块的最小值
    const minValue = lockedCounts[colorId] || 0
    const clampedValue = Math.max(value, minValue)

    const newReq = { ...requirement }
    if (clampedValue === 0) {
      delete newReq[colorId]
    }
    else {
      newReq[colorId] = clampedValue
    }
    onChange(newReq)
  }

  return (
    <div className="w-72 space-y-3 p-3">
      {/* 显示已使用/总数的进度提示 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 border-b">
        <span>颜色需求配置</span>
        <span className={cn(
          'tabular-nums font-medium',
          remaining === 0 && 'text-amber-500',
        )}
        >
          {totalUsed}
          {' '}
          /
          {maxCount}
        </span>
      </div>

      {COLORS.map((color) => {
        const currentValue = requirement[color.id] || 0
        const lockedMin = lockedCounts[color.id] || 0
        // 每个颜色的最大值 = 当前值 + 剩余可用数量
        const colorMax = currentValue + remaining
        // 当剩余为0且当前值为0时，或锁定数量达到最大值时，禁用该 Slider
        const isDisabled = (remaining === 0 && currentValue === 0) || lockedMin >= colorMax

        return (
          <div key={color.id} className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-16">
              <div className={cn('size-4 rounded shrink-0', color.bgClass)} />
              <Label className={cn(
                'text-sm whitespace-nowrap',
                isDisabled && 'text-muted-foreground',
              )}
              >
                {color.name}
              </Label>
            </div>
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <Slider
                value={[currentValue]}
                onValueChange={([value]) => handleChange(color.id, value)}
                max={colorMax}
                min={lockedMin}
                step={1}
                disabled={isDisabled}
                className={cn('flex-1', isDisabled && 'opacity-50')}
              />
              <div className={cn(
                'flex items-center justify-end gap-1 w-7',
                isDisabled && 'text-muted-foreground',
              )}
              >
                <span className="text-sm tabular-nums">{currentValue}</span>
                {lockedMin > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircleIcon className="size-3.5 text-muted-foreground shrink-0 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <span>
                        其中
                        {lockedMin}
                        个来自锁定块
                      </span>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
