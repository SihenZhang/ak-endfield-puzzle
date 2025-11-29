"""
FastAPI 接口 - 网格逻辑拼图求解器
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Tuple, Set
from ortools.sat.python import cp_model


# ========== Pydantic 模型 ==========

class LockedBlock(BaseModel):
    coord: List[int]  # [row, col]
    color: int


class PieceInput(BaseModel):
    id: int
    color: int
    shape: List[List[int]]  # [[row, col], ...]


class PuzzleRequest(BaseModel):
    rows: int
    cols: int
    obstacles: List[List[int]]
    lockedBlocks: List[LockedBlock]
    rowRequirements: List[Dict[str, int]]  # { "colorId": count }
    colRequirements: List[Dict[str, int]]
    pieces: List[PieceInput]


class PlacedPiece(BaseModel):
    id: int
    anchor: List[int]
    shape: List[List[int]]


class SolveResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    placements: Optional[List[PlacedPiece]] = None


# ========== 求解器逻辑 ==========

Pos = Tuple[int, int]


def normalize_shape(shape: List[Pos]) -> List[Pos]:
    """归一化形状，使最小坐标为(0,0)"""
    if not shape:
        return []
    min_r = min(p[0] for p in shape)
    min_c = min(p[1] for p in shape)
    return sorted([(p[0] - min_r, p[1] - min_c) for p in shape])


def get_rotations(shape: List[Pos]) -> List[List[Pos]]:
    """获取所有旋转变体（0°, 90°, 180°, 270°）"""
    rotations = []
    current = shape
    for _ in range(4):
        normalized = normalize_shape(current)
        if normalized not in rotations:
            rotations.append(normalized)
        current = [(p[1], -p[0]) for p in current]
    return rotations


def get_all_placements(shape: List[Pos], rows: int, cols: int) -> List[Tuple[Pos, List[Pos]]]:
    """获取拼图块所有可能的放置位置"""
    placements = []
    for rotation in get_rotations(shape):
        for r in range(rows):
            for c in range(cols):
                anchor = (r, c)
                absolute = [(anchor[0] + p[0], anchor[1] + p[1]) for p in rotation]
                if all(0 <= pos[0] < rows and 0 <= pos[1] < cols for pos in absolute):
                    placements.append((anchor, absolute))
    return placements


def solve_puzzle(req: PuzzleRequest) -> SolveResponse:
    """使用 OR-Tools CP-SAT 求解拼图"""
    rows, cols = req.rows, req.cols
    
    # 转换数据
    obstacles: Set[Pos] = {(o[0], o[1]) for o in req.obstacles}
    locked: Dict[Pos, int] = {(lb.coord[0], lb.coord[1]): lb.color for lb in req.lockedBlocks}
    
    def is_valid_cell(pos: Pos) -> bool:
        return pos not in obstacles and pos not in locked
    
    # 创建模型
    model = cp_model.CpModel()
    
    # 为每个拼图块生成有效放置
    placement_vars: Dict[int, List[cp_model.IntVar]] = {}
    placement_info: Dict[int, List[Tuple[Pos, List[Pos]]]] = {}
    
    for piece in req.pieces:
        shape = [(s[0], s[1]) for s in piece.shape]
        all_placements = get_all_placements(shape, rows, cols)
        
        valid = []
        vars_list = []
        for idx, (anchor, positions) in enumerate(all_placements):
            if all(is_valid_cell(p) for p in positions):
                valid.append((anchor, positions))
                var = model.NewBoolVar(f'p{piece.id}_{idx}')
                vars_list.append(var)
        
        if not valid:
            return SolveResponse(
                success=False,
                message=f"拼图块 {piece.id} 没有有效放置位置"
            )
        
        placement_vars[piece.id] = vars_list
        placement_info[piece.id] = valid
        
        # 约束：每个拼图块恰好放置一次
        model.AddExactlyOne(vars_list)
    
    # 约束：每个格子最多被占用一次
    cell_vars: Dict[Pos, List[cp_model.IntVar]] = {}
    for piece in req.pieces:
        for var, (_, positions) in zip(placement_vars[piece.id], placement_info[piece.id]):
            for pos in positions:
                if pos not in cell_vars:
                    cell_vars[pos] = []
                cell_vars[pos].append(var)
    
    for pos, vlist in cell_vars.items():
        if len(vlist) > 1:
            model.AddAtMostOne(vlist)
    
    # 约束：行列颜色要求
    def add_color_constraint(index: int, is_row: bool, requirements: Dict[str, int]):
        for color_str, required in requirements.items():
            color = int(color_str)
            
            # 计算锁定块贡献
            locked_count = sum(
                1 for pos, c in locked.items()
                if c == color and (pos[0] == index if is_row else pos[1] == index)
            )
            
            # 收集拼图块贡献
            contrib_vars = []
            contrib_counts = []
            for piece in req.pieces:
                if piece.color != color:
                    continue
                for var, (_, positions) in zip(placement_vars[piece.id], placement_info[piece.id]):
                    count = sum(
                        1 for p in positions
                        if (p[0] == index if is_row else p[1] == index)
                    )
                    if count > 0:
                        contrib_vars.append(var)
                        contrib_counts.append(count)
            
            if contrib_vars:
                total = sum(v * c for v, c in zip(contrib_vars, contrib_counts))
                model.Add(locked_count + total == required)
            elif locked_count != required:
                return False
        return True
    
    for r in range(rows):
        if not add_color_constraint(r, True, req.rowRequirements[r]):
            return SolveResponse(success=False, message=f"第 {r} 行的颜色约束无法满足")
    
    for c in range(cols):
        if not add_color_constraint(c, False, req.colRequirements[c]):
            return SolveResponse(success=False, message=f"第 {c} 列的颜色约束无法满足")
    
    # 求解
    solver = cp_model.CpSolver()
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)
    
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return SolveResponse(success=False, message=f"无解 ({solver.StatusName(status)})")
    
    # 提取结果
    placements = []
    for piece in req.pieces:
        for var, (anchor, positions) in zip(placement_vars[piece.id], placement_info[piece.id]):
            if solver.Value(var) == 1:
                rel_shape = [[p[0] - anchor[0], p[1] - anchor[1]] for p in positions]
                placements.append(PlacedPiece(
                    id=piece.id,
                    anchor=[anchor[0], anchor[1]],
                    shape=rel_shape
                ))
                break
    
    return SolveResponse(success=True, placements=placements)


# ========== FastAPI 应用 ==========

app = FastAPI(title="Puzzle Solver API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/solve", response_model=SolveResponse)
async def solve(request: PuzzleRequest) -> SolveResponse:
    """求解拼图谜题"""
    try:
        return solve_puzzle(request)
    except Exception as e:
        return SolveResponse(success=False, message=str(e))
