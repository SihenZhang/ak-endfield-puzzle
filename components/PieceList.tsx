'use client'

import type { Piece } from '@/lib/types'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getColorById } from '@/lib/colors'
import { cn } from '@/lib/utils'

interface PieceListProps {
  pieces: Piece[]
  disabled: boolean
  onEdit: (piece: Piece) => void
  onDelete: (id: number) => void
  onAdd: () => void
}

export function PieceList({
  pieces,
  disabled,
  onEdit,
  onDelete,
  onAdd,
}: PieceListProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <h3 className="text-sm font-semibold">拼图块</h3>
      <ScrollArea className="h-[calc(100vh-20rem)]">
        <div className="grid grid-cols-2 gap-3 pr-4">
          {pieces.map((piece, index) => (
            <PieceCard
              key={piece.id}
              piece={piece}
              index={index + 1}
              disabled={disabled}
              onEdit={() => onEdit(piece)}
              onDelete={() => onDelete(piece.id)}
            />
          ))}
          <Card
            className={cn(
              'flex aspect-square cursor-pointer items-center justify-center border-2 border-dashed transition-colors hover:bg-accent',
              disabled && 'pointer-events-none opacity-50',
            )}
            onClick={onAdd}
          >
            <PlusIcon className="size-8 text-muted-foreground" />
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}

interface PieceCardProps {
  piece: Piece
  index: number
  disabled: boolean
  onEdit: () => void
  onDelete: () => void
}

function PieceCard({ piece, index, disabled, onEdit, onDelete }: PieceCardProps) {
  const color = getColorById(piece.color)

  // Calculate bounds for rendering
  const rows = Math.max(...piece.shape.map(c => c[0])) + 1
  const cols = Math.max(...piece.shape.map(c => c[1])) + 1
  const cellSize = Math.min(80 / Math.max(rows, cols), 16)

  return (
    <Card
      className={cn(
        'relative aspect-square cursor-pointer p-3 transition-colors hover:bg-accent',
        disabled && 'pointer-events-none opacity-50',
      )}
      onClick={onEdit}
    >
      <div className="absolute top-2 left-2 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {index}
      </div>
      <button
        type="button"
        className="absolute top-2 right-2 rounded p-1 hover:bg-destructive/10 hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        disabled={disabled}
        aria-label="删除拼图块"
      >
        <Trash2Icon className="size-3" />
      </button>

      <div className="flex h-full items-center justify-center">
        <div
          className="relative"
          style={{
            width: cols * cellSize,
            height: rows * cellSize,
          }}
        >
          {piece.shape.map((coord, i) => (
            <div
              key={i}
              className={cn('absolute rounded-sm', color.bgClass)}
              style={{
                left: coord[1] * cellSize,
                top: coord[0] * cellSize,
                width: cellSize - 2,
                height: cellSize - 2,
              }}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
