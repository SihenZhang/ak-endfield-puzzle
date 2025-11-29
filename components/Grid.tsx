'use client'

import type { ColorId, ColorRequirement, Coord, PlacedPiece } from '@/lib/types'
import { BanIcon, LockIcon } from 'lucide-react'
import { Fragment, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getColorById } from '@/lib/colors'
import { cn, coordToKey } from '@/lib/utils'
import { RequirementBars } from './RequirementBars'
import { RequirementEditor } from './RequirementEditor'

interface GridProps {
  rows: number
  cols: number
  obstacles: Set<string>
  locked: Map<string, ColorId>
  rowRequirements: ColorRequirement[]
  colRequirements: ColorRequirement[]
  pieces: Array<{ id: number, color: ColorId }>
  placements?: PlacedPiece[]
  hoveredCell: Coord | null
  disabled: boolean
  onCellClick: (coord: Coord) => void
  onCellHover: (coord: Coord | null) => void
  onRowRequirementChange: (row: number, req: ColorRequirement) => void
  onColRequirementChange: (col: number, req: ColorRequirement) => void
}

export function Grid({
  rows,
  cols,
  obstacles,
  locked,
  rowRequirements,
  colRequirements,
  pieces,
  placements,
  hoveredCell,
  disabled,
  onCellClick,
  onCellHover,
  onRowRequirementChange,
  onColRequirementChange,
}: GridProps) {
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [editingCol, setEditingCol] = useState<number | null>(null)

  // Build a map from piece ID to color
  const pieceColorMap = new Map<number, ColorId>()
  pieces.forEach(piece => pieceColorMap.set(piece.id, piece.color))

  // Build a map of which cells belong to which piece
  const cellToPiece = new Map<string, { id: number, color: ColorId }>()
  if (placements) {
    for (const placement of placements) {
      const color = pieceColorMap.get(placement.id) || 0
      for (const offset of placement.shape) {
        const cellCoord: Coord = [
          placement.anchor[0] + offset[0],
          placement.anchor[1] + offset[1],
        ]
        cellToPiece.set(coordToKey(cellCoord), {
          id: placement.id,
          color,
        })
      }
    }
  }

  const getMaxCountForRow = (row: number): number => {
    let count = 0
    for (let c = 0; c < cols; c++) {
      const key = coordToKey([row, c])
      if (!obstacles.has(key)) {
        count++
      }
    }
    return count
  }

  const getMaxCountForCol = (col: number): number => {
    let count = 0
    for (let r = 0; r < rows; r++) {
      const key = coordToKey([r, col])
      if (!obstacles.has(key)) {
        count++
      }
    }
    return count
  }

  // 计算某一行中锁定块的颜色统计
  const getLockedCountsForRow = (row: number): ColorRequirement => {
    const counts: ColorRequirement = {}
    for (let c = 0; c < cols; c++) {
      const key = coordToKey([row, c])
      const color = locked.get(key)
      if (color !== undefined) {
        counts[color] = (counts[color] || 0) + 1
      }
    }
    return counts
  }

  // 计算某一列中锁定块的颜色统计
  const getLockedCountsForCol = (col: number): ColorRequirement => {
    const counts: ColorRequirement = {}
    for (let r = 0; r < rows; r++) {
      const key = coordToKey([r, col])
      const color = locked.get(key)
      if (color !== undefined) {
        counts[color] = (counts[color] || 0) + 1
      }
    }
    return counts
  }

  const renderCell = (r: number, c: number) => {
    const coord: Coord = [r, c]
    const key = coordToKey(coord)
    const isObstacle = obstacles.has(key)
    const lockedColor = locked.get(key)
    const isHovered = hoveredCell && hoveredCell[0] === r && hoveredCell[1] === c
    const placement = cellToPiece.get(key)

    let cellContent = null
    let cellClass = 'bg-white border-gray-300'

    if (isObstacle) {
      cellClass = 'bg-gray-300'
      cellContent = <BanIcon className="size-4 text-gray-600" />
    }
    else if (lockedColor !== undefined) {
      const color = getColorById(lockedColor)
      cellClass = color.bgClass
      cellContent = <LockIcon className="size-4 text-white" />
    }
    else if (placement) {
      const color = getColorById(placement.color)
      cellClass = `${color.bgClass} opacity-70`
      cellContent = (
        <span className="text-xs font-semibold text-white">
          {placement.id}
        </span>
      )
    }
    else if (isHovered && !disabled) {
      cellClass = 'bg-gray-200 border-gray-400'
    }

    return (
      <div
        key={key}
        className={cn(
          'flex items-center justify-center border-2 transition-colors',
          cellClass,
          !disabled && !isObstacle && !lockedColor && 'cursor-pointer',
        )}
        style={{ aspectRatio: '1' }}
        onClick={() => !disabled && onCellClick(coord)}
        onMouseEnter={() => !disabled && onCellHover(coord)}
        onMouseLeave={() => !disabled && onCellHover(null)}
      >
        {cellContent}
      </div>
    )
  }

  const renderRowRequirement = (row: number) => {
    const req = rowRequirements[row] || {}
    const isEmpty = Object.keys(req).length === 0

    return (
      <Popover
        open={editingRow === row}
        onOpenChange={(open) => {
          if (!disabled) {
            setEditingRow(open ? row : null)
          }
        }}
      >
        <PopoverTrigger asChild>
          {isEmpty
            ? (
                <button
                  type="button"
                  className="flex w-12 h-12 items-center justify-center border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  disabled={disabled}
                >
                  点击
                  <br />
                  设置
                </button>
              )
            : (
                <button
                  type="button"
                  className="flex min-w-12 h-12 p-1 hover:bg-gray-50 disabled:opacity-50"
                  disabled={disabled}
                  aria-label="点击设置"
                >
                  <RequirementBars requirement={req} orientation="horizontal" className="w-full h-full" />
                </button>
              )}
        </PopoverTrigger>
        <PopoverContent side="left" align="center" className="p-0">
          <RequirementEditor
            requirement={req}
            maxCount={getMaxCountForRow(row)}
            lockedCounts={getLockedCountsForRow(row)}
            onChange={(newReq) => {
              onRowRequirementChange(row, newReq)
            }}
          />
        </PopoverContent>
      </Popover>
    )
  }

  const renderColRequirement = (col: number) => {
    const req = colRequirements[col] || {}
    const isEmpty = Object.keys(req).length === 0

    return (
      <Popover
        open={editingCol === col}
        onOpenChange={(open) => {
          if (!disabled) {
            setEditingCol(open ? col : null)
          }
        }}
      >
        <PopoverTrigger asChild>
          {isEmpty
            ? (
                <button
                  type="button"
                  className="flex w-12 h-12 items-center justify-center border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  disabled={disabled}
                >
                  点击
                  <br />
                  设置
                </button>
              )
            : (
                <button
                  type="button"
                  className="flex w-12 min-h-12 p-1 hover:bg-gray-50 disabled:opacity-50"
                  disabled={disabled}
                  aria-label="点击设置"
                >
                  <RequirementBars requirement={req} orientation="vertical" className="h-full w-full" />
                </button>
              )}
        </PopoverTrigger>
        <PopoverContent side="bottom" align="center" className="p-0">
          <RequirementEditor
            requirement={req}
            maxCount={getMaxCountForCol(col)}
            lockedCounts={getLockedCountsForCol(col)}
            onChange={(newReq) => {
              onColRequirementChange(col, newReq)
            }}
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div
      className="inline-grid gap-0"
      style={{
        gridTemplateColumns: `auto repeat(${cols}, 48px)`,
        gridTemplateRows: `auto repeat(${rows}, 48px)`,
      }}
    >
      {/* Top-left corner spacer */}
      <div />

      {/* Column requirements */}
      {Array.from({ length: cols }).map((_, c) => (
        <div key={`col-req-${c}`} className="flex flex-col justify-end">
          {renderColRequirement(c)}
        </div>
      ))}

      {/* Main grid: row requirements + cells */}
      {Array.from({ length: rows }).map((_, r) => (
        <Fragment key={`row-${r}`}>
          {/* Row requirement */}
          <div key={`row-req-${r}`} className="flex justify-end">
            {renderRowRequirement(r)}
          </div>

          {/* Grid cells */}
          {Array.from({ length: cols }).map((_, c) => (
            <div key={`cell-${r}-${c}`} className="w-12 h-12">
              {renderCell(r, c)}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  )
}
