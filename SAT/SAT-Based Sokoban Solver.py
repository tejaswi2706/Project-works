"""
Sokoban Solver using SAT (Boilerplate)
--------------------------------------
Instructions:
- Implement encoding of Sokoban into CNF.
- Use PySAT to solve the CNF and extract moves.
- Ensure constraints for player movement, box pushes, and goal conditions.

Grid Encoding:
- 'P' = Player
- 'B' = Box
- 'G' = Goal
- '#' = Wall
- '.' = Empty space
"""

from pysat.formula import CNF
from pysat.solvers import Solver

# Directions for movement
DIRS = {'U': (-1, 0), 'D': (1, 0), 'L': (0, -1), 'R': (0, 1)}


class SokobanEncoder:
    def __init__(self, grid, T):
        """
        Initialize encoder with grid and time limit.

        Args:
            grid (list[list[str]]): Sokoban grid.
            T (int): Max number of steps allowed.
        """
        self.grid = grid
        self.T = T
        self.N = len(grid)
        self.M = len(grid[0])

        self.goals = []
        self.boxes = []
        self.walls=[]
        self.player_start = None

        # TODO: Parse grid to fill self.goals, self.boxes, self.player_start
        self._parse_grid()

        self.num_boxes = len(self.boxes)
        self.cnf = CNF()

    def _parse_grid(self):
        """Parse grid to find player, boxes, and goals."""
        # TODO: Implement parsing logic
        for i in range(self.N):
            for j in range(self.M):
                if self.grid[i][j]=="P":
                    self.player_start=(i, j)
                elif self.grid[i][j]=="G":
                    self.goals.append((i, j))
                elif self.grid[i][j]=="B":
                    self.boxes.append((i, j))
                elif self.grid[i][j]=="#":
                    self.walls.append((i, j))
        

    def player_id(self, x, y, t):
        # TODO: Implement encoding scheme
        return 1+t*self.N*self.M+x*self.M+y
        

    def box_id(self, b, x, y, t):
        """
        Variable ID for box b at (x, y) at time t.
        """
        # TODO: Implement encoding scheme
        player_ids=(self.T+1)*self.N*self.M
        return player_ids + 1 + t*self.num_boxes*self.N*self.M + b*self.N* self.M + x*self.M + y
        

    # ---------------- Encoding Logic ----------------
    def encode(self):
        """
        Build CNF constraints for Sokoban:
        - Initial state
        - Valid moves (player + box pushes)
        - Non-overlapping boxes
        - Goal condition at final timestep
        """
        # TODO: Add constraints for:
        # 1. Initial conditions
        # 2. Player movement
        # 3. Box movement (push rules)
        # 4. Non-overlap constraints
        # 5. Goal conditions
        # 6. Other conditions
        # 1. Initial conditions
        (pi, pj)=self.player_start
        self.cnf.append([self.player_id(pi,pj,0)])
        for b, (bi,bj) in enumerate(self.boxes):
            self.cnf.append([self.box_id(b,bi,bj,0)])

        # 2. Player movement (exactly one position each time)
        for t in range(self.T+1):
            clause=[]
            for x in range(self.N):
                for y in range(self.M):
                    if (x,y) not in self.walls:
                        clause.append(self.player_id(x,y,t))
            if clause:
                self.cnf.append(clause)
                for i in range(len(clause)):
                    for j in range(i+1, len(clause)):
                        self.cnf.append([-clause[i], -clause[j]])

        # 3.Each box in exactly one position at each time
        for b in range(self.num_boxes):
            for t in range(self.T+1):
                clause=[]
                for x in range(self.N):
                    for y in range(self.M):
                        if (x,y) not in self.walls:
                            clause.append(self.box_id(b,x,y,t))
                if clause:
                    self.cnf.append(clause)
                    for i in range(len(clause)):
                        for j in range(i+1, len(clause)):
                            self.cnf.append([-clause[i], -clause[j]])

        # 4.Player and box cannot be in same box at any time
        for t in range(self.T+1):
            for x in range(self.N):
                for y in range(self.M):
                    if (x, y) not in self.walls:
                        for b in range(self.num_boxes):
                            self.cnf.append([-self.player_id(x,y,t),-self.box_id(b,x,y,t)])

        # 5.Box movement(push rules)
        for t in range(self.T):
            for x in range(self.N):
                for y in range(self.M):
                    if (x,y) in self.walls:
                        continue
                    
                    curr_p=self.player_id(x,y,t)
                    next_positions=[]
                    
                    for d,(dx,dy) in DIRS.items():
                        nx,ny = x+dx, y+dy
                        if (0<=nx<self.N and 0<=ny<self.M):
                            if (nx,ny) not in self.walls:
                                next_p = self.player_id(nx,ny,t+1)
                                next_positions.append(next_p)
                                
                                # Case of box pushing
                                for b in range(self.num_boxes):
                                    box_at_target = self.box_id(b,nx,ny,t)
                                    nnx,nny = nx+dx,ny+dy
                                    if (0<=nnx<self.N and 0<=nny<self.M):
                                        if (nnx, nny) not in self.walls:
                                            box_next_pos = self.box_id(b, nnx, nny, t + 1)
                                            # if player moves and there's a box there, both move
                                            self.cnf.append([-curr_p, -box_at_target, next_p])
                                            self.cnf.append([-curr_p, -box_at_target, box_next_pos])
                                            # player doesn't move if box can't be pushed
                                            self.cnf.append([-curr_p, -box_at_target, -next_p, box_next_pos])

                    # Player should move to exaclty one adjacent position
                    if next_positions:
                        # Atleast one
                        self.cnf.append([-curr_p] + next_positions)
                        # Atmost one
                        for i in range(len(next_positions)):
                            for j in range(i + 1, len(next_positions)):
                                self.cnf.append([-next_positions[i], -next_positions[j]])

        # 6.Box doesn't move if player didn't push
        for b in range(self.num_boxes):
            for t in range(self.T):
                for x in range(self.N):
                    for y in range(self.M):
                        if (x,y) not in self.walls:
                            curr_box = self.box_id(b,x,y,t)
                            next_box = self.box_id(b,x,y,t+1)
                            
                            # Check all possible push directions that move this box
                            push_conditions=[]
                            for dx,dy in DIRS.values():
                                # Player position and box position
                                px,py = x-dx, y-dy
                                bx,by = x+dx, y+dy
                                if (0<=px<self.N and 0<=py<self.M):
                                   if (px,py) not in self.walls:
                                    if (0<=bx<self.N and 0<=by<self.M):
                                        if (bx,by) not in self.walls:
                                            player_pos = self.player_id(px, py, t)
                                            box_moved = self.box_id(b, bx, by, t + 1)
                                            push_conditions.append((player_pos, box_moved))
                             
                            if push_conditions:
                                push_clause=[]
                                for player_pos, box_moved in push_conditions:
                                    push_clause.append(player_pos)
                                    self.cnf.append([-curr_box,-player_pos,box_moved])
                                self.cnf.append([-curr_box]+push_clause+[next_box])
                            else:
                                self.cnf.append([-curr_box, next_box])

        #7.Goal condition
        for b in range(self.num_boxes):
            goal_clause=[]
            for gx, gy in self.goals:
                goal_clause.append(self.box_id(b,gx,gy,self.T))
            if goal_clause:
                self.cnf.append(goal_clause)

        return self.cnf


def decode(model, encoder):
    """
    Decode SAT model into list of moves ('U', 'D', 'L', 'R').

    Args:
        model (list[int]): Satisfying assignment from SAT solver.
        encoder (SokobanEncoder): Encoder object with grid info.

    Returns:
        list[str]: Sequence of moves.
    """
    N,M,T = encoder.N,encoder.M,encoder.T

    # TODO: Map player positions at each timestep to movement directions
    moves=[]
    model_set=set(model)

    for t in range(T):
        curr_pos,next_pos = None,None

        for x in range(N):
            for y in range(M):
                if (x,y) not in encoder.walls:
                    if encoder.player_id(x,y,t) in model_set:
                        curr_pos=(x,y)
                    if encoder.player_id(x,y,t+1) in model_set:
                        next_pos=(x,y)

        if curr_pos is None or next_pos is None:
            return -1

        dx,dy = next_pos[0]-curr_pos[0], next_pos[1]-curr_pos[1]
        if (dx,dy)==(-1,0): 
            moves.append('U')
        elif (dx,dy)==(1,0): 
            moves.append('D')
        elif (dx,dy)==(0,-1): 
            moves.append('L')
        elif (dx,dy)==(0,1): 
            moves.append('R')
        else:
            return -1
        
    return moves

    


def solve_sokoban(grid, T):
    """
    DO NOT MODIFY THIS FUNCTION.

    Solve Sokoban using SAT encoding.

    Args:
        grid (list[list[str]]): Sokoban grid.
        T (int): Max number of steps allowed.

    Returns:
        list[str] or "unsat": Move sequence or unsatisfiable.
    """
    encoder = SokobanEncoder(grid, T)
    cnf = encoder.encode()

    with Solver(name='g3') as solver:
        solver.append_formula(cnf)
        if not solver.solve():
            return -1

        model = solver.get_model()
        if not model:
            return -1

        return decode(model, encoder)


