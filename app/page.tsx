'use client'

import type { ToolMode } from '@/components/Toolbar'
import type { ColorId, ColorRequirement, Coord, Piece, PlacedPiece, Puzzle } from '@/lib/types'
import { Github } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Grid } from '@/components/Grid'
import { LoadPuzzleDialog } from '@/components/LoadPuzzleDialog'
import { OperationPanel } from '@/components/OperationPanel'
import { PieceEditorDialog } from '@/components/PieceEditorDialog'
import { PieceList } from '@/components/PieceList'
import { Toolbar } from '@/components/Toolbar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { UploadDialog } from '@/components/UploadDialog'
import { solvePuzzle } from '@/lib/api'
import { DEFAULT_COLOR_ID } from '@/lib/colors'
import { coordToKey, keyToCoord } from '@/lib/utils'

export default function Home() {
  // Grid state
  const [rows, setRows] = useState(5)
  const [cols, setCols] = useState(5)
  const [obstacles, setObstacles] = useState<Set<string>>(new Set())
  const [locked, setLocked] = useState<Map<string, ColorId>>(new Map())
  const [rowRequirements, setRowRequirements] = useState<ColorRequirement[]>(
    Array.from({ length: 5 }, () => ({})),
  )
  const [colRequirements, setColRequirements] = useState<ColorRequirement[]>(
    Array.from({ length: 5 }, () => ({})),
  )

  // Tool state
  const [toolMode, setToolMode] = useState<ToolMode>('none')
  const [lockedColor, setLockedColor] = useState<ColorId>(DEFAULT_COLOR_ID)
  const [hoveredCell, setHoveredCell] = useState<Coord | null>(null)

  // Piece state
  const [pieces, setPieces] = useState<Piece[]>([])
  const [nextPieceId, setNextPieceId] = useState(1)
  const [editingPiece, setEditingPiece] = useState<Piece | null>(null)
  const [pieceDialogOpen, setPieceDialogOpen] = useState(false)

  // Solve state
  const [isSolved, setIsSolved] = useState(false)
  const [isSolving, setIsSolving] = useState(false)
  const [placements, setPlacements] = useState<PlacedPiece[] | undefined>()

  // Upload & parse state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [parsedPuzzle, setParsedPuzzle] = useState<Puzzle | null>(null)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)

  const applyParsedPuzzle = (puzzle: Puzzle) => {
    setRows(puzzle.rows)
    setCols(puzzle.cols)
    setObstacles(new Set(puzzle.obstacles.map(coordToKey)))

    const newLocked = new Map<string, ColorId>()
    puzzle.lockedBlocks.forEach(({ coord, color }) => {
      newLocked.set(coordToKey(coord), color)
    })
    setLocked(newLocked)

    setRowRequirements(puzzle.rowRequirements)
    setColRequirements(puzzle.colRequirements)
    setPieces(puzzle.pieces)
    const nextId = puzzle.pieces.reduce((max, p) => Math.max(max, p.id), 0) + 1
    setNextPieceId(nextId)

    setIsSolved(false)
    setPlacements(undefined)
    setToolMode('none')
    setParsedPuzzle(null)
    setLoadDialogOpen(false)
    toast.success('已加载解析结果')
  }

  const isCurrentPuzzleEmpty = () =>
    obstacles.size === 0
    && locked.size === 0
    && pieces.length === 0
    && rowRequirements.every(req => Object.keys(req).length === 0)
    && colRequirements.every(req => Object.keys(req).length === 0)

  // Handle grid size changes
  const handleRowsChange = (newRows: number) => {
    if (newRows === rows)
      return

    // Adjust requirements array
    if (newRows > rows) {
      setRowRequirements([...rowRequirements, ...Array.from({ length: newRows - rows }, () => ({}))])
    }
    else {
      setRowRequirements(rowRequirements.slice(0, newRows))
    }

    // Remove obstacles and locked cells that are out of bounds
    const newObstacles = new Set<string>()
    obstacles.forEach((key) => {
      const [r] = keyToCoord(key)
      if (r < newRows) {
        newObstacles.add(key)
      }
    })
    setObstacles(newObstacles)

    const newLocked = new Map<string, ColorId>()
    locked.forEach((color, key) => {
      const [r] = keyToCoord(key)
      if (r < newRows) {
        newLocked.set(key, color)
      }
    })
    setLocked(newLocked)

    setRows(newRows)
  }

  const handleColsChange = (newCols: number) => {
    if (newCols === cols)
      return

    // Adjust requirements array
    if (newCols > cols) {
      setColRequirements([...colRequirements, ...Array.from({ length: newCols - cols }, () => ({}))])
    }
    else {
      setColRequirements(colRequirements.slice(0, newCols))
    }

    // Remove obstacles and locked cells that are out of bounds
    const newObstacles = new Set<string>()
    obstacles.forEach((key) => {
      const [, c] = keyToCoord(key)
      if (c < newCols) {
        newObstacles.add(key)
      }
    })
    setObstacles(newObstacles)

    const newLocked = new Map<string, ColorId>()
    locked.forEach((color, key) => {
      const [, c] = keyToCoord(key)
      if (c < newCols) {
        newLocked.set(key, color)
      }
    })
    setLocked(newLocked)

    setCols(newCols)
  }

  // Sync requirements helpers
  const syncRequirementsOnAdd = (coord: Coord, color: ColorId) => {
    const [r, c] = coord

    // Update row requirement
    const newRowReq = { ...rowRequirements[r] }
    newRowReq[color] = (newRowReq[color] || 0) + 1
    const newRowReqs = [...rowRequirements]
    newRowReqs[r] = newRowReq
    setRowRequirements(newRowReqs)

    // Update col requirement
    const newColReq = { ...colRequirements[c] }
    newColReq[color] = (newColReq[color] || 0) + 1
    const newColReqs = [...colRequirements]
    newColReqs[c] = newColReq
    setColRequirements(newColReqs)
  }

  const syncRequirementsOnRemove = (coord: Coord, color: ColorId) => {
    const [r, c] = coord

    // Update row requirement
    const newRowReq = { ...rowRequirements[r] }
    if (newRowReq[color]) {
      newRowReq[color] -= 1
      if (newRowReq[color] <= 0) {
        delete newRowReq[color]
      }
    }
    const newRowReqs = [...rowRequirements]
    newRowReqs[r] = newRowReq
    setRowRequirements(newRowReqs)

    // Update col requirement
    const newColReq = { ...colRequirements[c] }
    if (newColReq[color]) {
      newColReq[color] -= 1
      if (newColReq[color] <= 0) {
        delete newColReq[color]
      }
    }
    const newColReqs = [...colRequirements]
    newColReqs[c] = newColReq
    setColRequirements(newColReqs)
  }

  // Handle cell clicks
  const handleCellClick = (coord: Coord) => {
    if (isSolved)
      return

    const key = coordToKey(coord)

    if (toolMode === 'obstacle') {
      const newObstacles = new Set(obstacles)
      if (obstacles.has(key)) {
        newObstacles.delete(key)
      }
      else {
        // Remove locked block if present
        if (locked.has(key)) {
          const color = locked.get(key)!
          const newLocked = new Map(locked)
          newLocked.delete(key)
          setLocked(newLocked)
          // Sync requirements
          syncRequirementsOnRemove(coord, color)
        }
        newObstacles.add(key)
      }
      setObstacles(newObstacles)
    }
    else if (toolMode === 'locked') {
      const newLocked = new Map(locked)
      const existingColor = locked.get(key)

      if (existingColor !== undefined) {
        // Remove locked block
        newLocked.delete(key)
        setLocked(newLocked)
        syncRequirementsOnRemove(coord, existingColor)
      }
      else if (!obstacles.has(key)) {
        // Add locked block
        newLocked.set(key, lockedColor)
        setLocked(newLocked)
        syncRequirementsOnAdd(coord, lockedColor)
      }
    }
  }

  // Handle pieces
  const handleAddPiece = () => {
    setEditingPiece(null)
    setPieceDialogOpen(true)
  }

  const handleEditPiece = (piece: Piece) => {
    setEditingPiece(piece)
    setPieceDialogOpen(true)
  }

  const handleDeletePiece = (id: number) => {
    setPieces(pieces.filter(p => p.id !== id))
  }

  const handleSavePiece = (pieceData: Omit<Piece, 'id'>) => {
    if (editingPiece) {
      // Update existing piece
      setPieces(pieces.map(p => (p.id === editingPiece.id ? { ...pieceData, id: p.id } : p)))
    }
    else {
      // Add new piece
      setPieces([...pieces, { ...pieceData, id: nextPieceId }])
      setNextPieceId(nextPieceId + 1)
    }
  }

  // Handle solve
  const handleSolve = async () => {
    setIsSolving(true)

    try {
      const result = await solvePuzzle({
        rows,
        cols,
        obstacles: Array.from(obstacles).map(keyToCoord),
        lockedBlocks: Array.from(locked.entries()).map(([key, color]) => ({
          coord: keyToCoord(key),
          color,
        })),
        rowRequirements,
        colRequirements,
        pieces,
      })

      setIsSolved(true)
      setPlacements(result)
      toast.success('求解成功！')
    }
    catch (error) {
      toast.error(error instanceof Error ? error.message : '求解失败')
    }
    finally {
      setIsSolving(false)
    }
  }

  // Handle clear solution (only remove the solution, keep the puzzle)
  const handleClearSolution = () => {
    setIsSolved(false)
    setPlacements(undefined)
    toast.success('已清除答案')
  }

  // Handle clear (reset everything)
  const handleClear = () => {
    setRows(5)
    setCols(5)
    setObstacles(new Set())
    setLocked(new Map())
    setRowRequirements(Array.from({ length: 5 }, () => ({})))
    setColRequirements(Array.from({ length: 5 }, () => ({})))
    setPieces([])
    setNextPieceId(1)
    setIsSolved(false)
    setPlacements(undefined)
    setToolMode('none')
    toast.success('已清空')
  }

  const handleUploadOpen = () => {
    setUploadDialogOpen(true)
  }

  const handleUploadParsed = (puzzle: Puzzle) => {
    if (isCurrentPuzzleEmpty()) {
      setUploadDialogOpen(false)
      applyParsedPuzzle(puzzle)
      return
    }

    setParsedPuzzle(puzzle)
    setLoadDialogOpen(true)
    setUploadDialogOpen(false)
  }

  const handleConfirmLoadPuzzle = () => {
    if (!parsedPuzzle)
      return
    applyParsedPuzzle(parsedPuzzle)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">终末地拼图解谜工具</h1>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href="https://github.com/SihenZhang/ak-endfield-puzzle"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="前往GitHub仓库"
              >
                <Github className="size-6" />
              </a>
            </TooltipTrigger>
            <TooltipContent>前往GitHub仓库</TooltipContent>
          </Tooltip>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-6">
          {/* Left: Workspace */}
          <div className="space-y-4">
            <Toolbar
              rows={rows}
              cols={cols}
              toolMode={toolMode}
              lockedColor={lockedColor}
              disabled={isSolved}
              onRowsChange={handleRowsChange}
              onColsChange={handleColsChange}
              onToolModeChange={setToolMode}
              onLockedColorChange={setLockedColor}
            />

            <div className="flex justify-center rounded-lg border bg-card p-6">
              <Grid
                rows={rows}
                cols={cols}
                obstacles={obstacles}
                locked={locked}
                rowRequirements={rowRequirements}
                colRequirements={colRequirements}
                pieces={pieces}
                placements={placements}
                hoveredCell={hoveredCell}
                disabled={isSolved}
                onCellClick={handleCellClick}
                onCellHover={setHoveredCell}
                onRowRequirementChange={(row, req) => {
                  const newReqs = [...rowRequirements]
                  newReqs[row] = req
                  setRowRequirements(newReqs)
                }}
                onColRequirementChange={(col, req) => {
                  const newReqs = [...colRequirements]
                  newReqs[col] = req
                  setColRequirements(newReqs)
                }}
              />
            </div>
          </div>

          {/* Right: Tools */}
          <div className="w-80 space-y-4">
            <OperationPanel
              isSolving={isSolving}
              isSolved={isSolved}
              onSolve={handleSolve}
              onClearSolution={handleClearSolution}
              onClear={handleClear}
              onUpload={handleUploadOpen}
            />

            <PieceList
              pieces={pieces}
              disabled={isSolved}
              onEdit={handleEditPiece}
              onDelete={handleDeletePiece}
              onAdd={handleAddPiece}
            />
          </div>
        </div>
      </div>

      <PieceEditorDialog
        open={pieceDialogOpen}
        piece={editingPiece || undefined}
        onSave={handleSavePiece}
        onClose={() => setPieceDialogOpen(false)}
      />

      <UploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onParsed={handleUploadParsed}
      />

      <LoadPuzzleDialog
        open={loadDialogOpen}
        puzzle={parsedPuzzle}
        onConfirm={handleConfirmLoadPuzzle}
        onClose={() => setLoadDialogOpen(false)}
      />
    </div>
  )
}
