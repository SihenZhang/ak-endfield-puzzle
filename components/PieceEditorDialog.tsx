'use client'

import type { ColorId, Coord, Piece } from '@/lib/types'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { COLORS, DEFAULT_COLOR_ID, getColorById } from '@/lib/colors'
import { cn, coordToKey } from '@/lib/utils'

interface PieceEditorDialogProps {
  open: boolean
  piece?: Piece
  onSave: (piece: Omit<Piece, 'id'>) => void
  onClose: () => void
}

const EDITOR_SIZE = 5

export function PieceEditorDialog({
  open,
  piece,
  onSave,
  onClose,
}: PieceEditorDialogProps) {
  const [color, setColor] = useState<ColorId>(DEFAULT_COLOR_ID)
  const [shape, setShape] = useState<Set<string>>(new Set())
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawMode, setDrawMode] = useState<'add' | 'remove'>('add')

  useEffect(() => {
    if (open) {
      if (piece) {
        setColor(piece.color)
        setShape(new Set(piece.shape.map(coordToKey)))
      }
      else {
        setColor(DEFAULT_COLOR_ID)
        setShape(new Set())
      }
    }
  }, [open, piece])

  const handlePointerDown = (coord: Coord) => {
    const key = coordToKey(coord)
    const hasCell = shape.has(key)
    setDrawMode(hasCell ? 'remove' : 'add')
    setIsDrawing(true)

    const newShape = new Set(shape)
    if (hasCell) {
      newShape.delete(key)
    }
    else {
      newShape.add(key)
    }
    setShape(newShape)
  }

  const handlePointerEnter = (coord: Coord) => {
    if (!isDrawing)
      return

    const key = coordToKey(coord)
    const newShape = new Set(shape)
    if (drawMode === 'add') {
      newShape.add(key)
    }
    else {
      newShape.delete(key)
    }
    setShape(newShape)
  }

  const handlePointerUp = () => {
    setIsDrawing(false)
  }

  const normalizeShape = (coords: Coord[]): Coord[] => {
    if (coords.length === 0)
      return []

    const minR = Math.min(...coords.map(c => c[0]))
    const minC = Math.min(...coords.map(c => c[1]))

    return coords.map(([r, c]) => [r - minR, c - minC] as Coord)
  }

  const handleSave = () => {
    const coords = Array.from(shape).map((key) => {
      const [r, c] = key.split(',').map(Number)
      return [r, c] as Coord
    })

    if (coords.length === 0) {
      return
    }

    const normalized = normalizeShape(coords)
    onSave({ color, shape: normalized })
    onClose()
  }

  const selectedColor = getColorById(color)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{piece ? '编辑拼图块' : '添加拼图块'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>颜色</Label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={cn(
                    'size-8 rounded transition-all',
                    c.bgClass,
                    color === c.id && 'ring-2 ring-offset-2',
                    color === c.id && c.ringClass,
                  )}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>形状 (拖动绘制)</Label>
            <div
              className="inline-grid gap-1 select-none touch-none"
              style={{
                gridTemplateColumns: `repeat(${EDITOR_SIZE}, minmax(0, 1fr))`,
              }}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {Array.from({ length: EDITOR_SIZE }).map((_, r) =>
                Array.from({ length: EDITOR_SIZE }).map((_, c) => {
                  const coord: Coord = [r, c]
                  const key = coordToKey(coord)
                  const isActive = shape.has(key)

                  return (
                    <div
                      key={key}
                      className={cn(
                        'size-10 border-2 rounded cursor-pointer transition-colors',
                        isActive ? selectedColor.bgClass : 'bg-gray-100 hover:bg-gray-200',
                      )}
                      onPointerDown={() => handlePointerDown(coord)}
                      onPointerEnter={() => handlePointerEnter(coord)}
                    />
                  )
                }),
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={shape.size === 0}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
