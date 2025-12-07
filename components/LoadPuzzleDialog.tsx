'use client'

import type { Puzzle } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from '@/components/ui/item'

interface LoadPuzzleDialogProps {
  open: boolean
  puzzle: Puzzle | null
  onConfirm: () => void
  onClose: () => void
}

export function LoadPuzzleDialog({ open, puzzle, onConfirm, onClose }: LoadPuzzleDialogProps) {
  if (!puzzle) {
    return null
  }

  const obstacleCount = puzzle.obstacles.length
  const lockedCount = puzzle.lockedBlocks.length
  const pieceCount = puzzle.pieces.length

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>加载解析结果</DialogTitle>
          <DialogDescription>确定后将覆盖当前谜题配置</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Item variant="outline" size="sm">
            <ItemContent>
              <ItemTitle>尺寸</ItemTitle>
            </ItemContent>
            <ItemActions>
              {`${puzzle.rows} 行 × ${puzzle.cols} 列`}
            </ItemActions>
          </Item>
          <Item variant="outline" size="sm">
            <ItemContent>
              <ItemTitle>障碍格</ItemTitle>
            </ItemContent>
            <ItemActions>
              {obstacleCount}
            </ItemActions>
          </Item>
          <Item variant="outline" size="sm">
            <ItemContent>
              <ItemTitle>锁定块</ItemTitle>
            </ItemContent>
            <ItemActions>
              {lockedCount}
            </ItemActions>
          </Item>
          <Item variant="outline" size="sm">
            <ItemContent>
              <ItemTitle>拼图块</ItemTitle>
            </ItemContent>
            <ItemActions>
              {pieceCount}
            </ItemActions>
          </Item>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={onConfirm}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
