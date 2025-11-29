'use client'

import type { ColorId } from '@/lib/types'
import { BanIcon, LockIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { COLORS } from '@/lib/colors'
import { cn } from '@/lib/utils'

export type ToolMode = 'none' | 'obstacle' | 'locked'

interface ToolbarProps {
  rows: number
  cols: number
  toolMode: ToolMode
  lockedColor: ColorId
  disabled: boolean
  onRowsChange: (rows: number) => void
  onColsChange: (cols: number) => void
  onToolModeChange: (mode: ToolMode) => void
  onLockedColorChange: (color: ColorId) => void
}

export function Toolbar({
  rows,
  cols,
  toolMode,
  lockedColor,
  disabled,
  onRowsChange,
  onColsChange,
  onToolModeChange,
  onLockedColorChange,
}: ToolbarProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">
            行数:
            {rows}
          </Label>
          <Slider
            value={[rows]}
            onValueChange={([value]) => onRowsChange(value)}
            min={2}
            max={15}
            step={1}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">
            列数:
            {cols}
          </Label>
          <Slider
            value={[cols]}
            onValueChange={([value]) => onColsChange(value)}
            min={2}
            max={15}
            step={1}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">工具</Label>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={2}
            value={toolMode === 'none' ? '' : toolMode}
            onValueChange={(value) => {
              onToolModeChange((value as ToolMode) || 'none')
            }}
            disabled={disabled}
          >
            <ToggleGroupItem
              value="obstacle"
              aria-label="障碍格"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <BanIcon className="size-4" />
              <span>障碍格</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="locked"
              aria-label="锁定块"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <LockIcon className="size-4" />
              <span>锁定块</span>
            </ToggleGroupItem>
          </ToggleGroup>

          {toolMode === 'locked' && (
            <div className="flex items-center gap-2 rounded-md border p-1.5">
              {COLORS.map(color => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => onLockedColorChange(color.id)}
                  className={cn(
                    'size-6 rounded transition-all',
                    color.bgClass,
                    lockedColor === color.id && 'ring-2 ring-offset-2',
                    lockedColor === color.id && color.ringClass,
                  )}
                  title={color.name}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
