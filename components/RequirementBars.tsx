import type { ColorRequirement } from '@/lib/types'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getColorById } from '@/lib/colors'
import { cn } from '@/lib/utils'

interface RequirementBarsProps {
  requirement: ColorRequirement
  orientation: 'horizontal' | 'vertical'
  className?: string
}

export function RequirementBars({ requirement, orientation, className }: RequirementBarsProps) {
  const entries = Object.entries(requirement)
    .map(([colorId, count]) => ({ colorId: Number(colorId), count }))
    .filter(e => e.count > 0)

  if (entries.length === 0) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex gap-0.5',
            // Horizontal: color groups arranged left to right
            // Vertical: color groups stacked top to bottom
            orientation === 'horizontal' ? 'flex-col' : 'flex-row',
            className,
          )}
        >
          {entries.map(({ colorId, count }) => {
            const color = getColorById(colorId)
            // Create individual bars for each unit of count
            const bars = Array.from({ length: count }, (_, i) => i)

            return (
              <div
                key={colorId}
                className={cn(
                  'flex flex-1 gap-0.5 justify-end',
                  // Horizontal: bars within a color stack vertically
                  // Vertical: bars within a color arrange horizontally
                  orientation === 'horizontal' ? 'flex-row' : 'flex-col',
                )}
              >
                {bars.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      color.bgClass,
                      'rounded-sm',
                      // Small rectangular bars
                      orientation === 'horizontal'
                        ? 'w-1.5'
                        : 'h-1.5',
                    )}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </TooltipTrigger>
      <TooltipContent side={orientation === 'horizontal' ? 'left' : 'top'}>
        <div className="flex flex-col gap-1">
          {entries.map(({ colorId, count }) => {
            const color = getColorById(colorId)
            return (
              <div key={colorId} className="flex items-center gap-2">
                <div className={cn(color.bgClass, 'w-3 h-3 rounded-sm')} />
                <span>
                  {color.name}
                  :
                  {' '}
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
