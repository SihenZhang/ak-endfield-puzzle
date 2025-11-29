// Core types for the puzzle solver

export type Coord = [number, number]
export type ColorId = number // flexible; driven by palette config

// Piece shapes are normalized to include [0,0] as the anchor-origin
export interface Piece {
  id: number // unique piece id
  color: ColorId // color id from palette
  shape: Coord[] // list of offsets relative to [0,0]
}

// Row/Column requirements: key=color id, value=count
export type ColorRequirement = Record<number, number>

export interface Puzzle {
  rows: number
  cols: number
  obstacles: Coord[]
  lockedBlocks: Array<{ coord: Coord, color: ColorId }>
  rowRequirements: ColorRequirement[] // length = rows
  colRequirements: ColorRequirement[] // length = cols
  pieces: Piece[]
}

// Solver placement result uses an absolute anchor and a relative shape
export interface PlacedPiece {
  id: number
  anchor: Coord // absolute grid coord where piece's [0,0] is placed
  shape: Coord[] // relative offsets from anchor (includes [0,0])
}

export interface SolveResponse {
  success: boolean
  message?: string
  placements?: PlacedPiece[]
}
