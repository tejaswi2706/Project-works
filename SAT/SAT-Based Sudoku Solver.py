"""
sudoku_solver.py

Implement the function `solve_sudoku(grid: List[List[int]]) -> List[List[int]]` using a SAT solver from PySAT.
"""

from pysat.formula import CNF
from pysat.solvers import Solver
from typing import List

def solve_sudoku(grid: List[List[int]]) -> List[List[int]]:
    """Solves a Sudoku puzzle using a SAT solver. Input is a 2D grid with 0s for blanks."""

    # TODO: implement encoding and solving using PySAT
    
    cnf= CNF()
    n=len(grid)

    #a cell is represented by (i,j,d) that is (row, column, value)
    def cell(i, j, d):
        return (i-1)*n*n + (j-1)*n+d
    # change of order (i.e between i,j,d) is also fine as it also would give unique no. to each cell

    def valueofcell(clauses: List[int]):
        cnf.append(clauses)
        for i in range(len(clauses)):
            for j in range(i+1, len(clauses)):
                cnf.append([-clauses[i], -clauses[j]]) 
    # this function is for implementing logic that each cell has exaclty one value (atleast one and atmost one)

    for i in range(1,n+1):
        for j in range(1, n+1):
            values=[]
            for d in range(1, n+1):
                values.append(cell(i, j, d))
            valueofcell(values)

    for i in range(1,n+1):
        for d in range(1,n+1):
            values=[]  
            for j in range(1, n+1):  
                values.append(cell(i, j, d))  
            valueofcell(values)  

    for j in range(1,n+1):
        for d in range(1, n+1):
            values=[]
            for i in range(1, n+1):
                values.append(cell(i, j, d))    
            valueofcell(values)

    for ai in range(0, int(n**0.5)):
        for aj in range(0,int(n**0.5)):
            for d in range(1, n+1):
                cells=[]
                for i in range(ai*int(n**0.5)+1, (ai+1)*int(n**0.5)+1):
                    for j in range(aj*int(n**0.5)+1, (aj+1)*int(n**0.5)+1):
                        cells.append(cell(i, j, d))
                valueofcell(cells)

    for i in range(1,n+1):
        for j in range(1,n+1):
            if grid[i-1][j-1]!=0:
                cnf.append([cell(i,j,grid[i-1][j-1])])

    with Solver(name='glucose3') as solver:
        solver.append_formula(cnf.clauses)
        if solver.solve():
            model = solver.get_model()
            
        else:
            print("UNSAT")

    solution=[]
    for i in range(0,n):
        row=[]
        for j in range(0,n):
            row.append(0)
        solution.append(row)

    for value in model:
        if value>0 :
            v=value-1
            i=v//(n*n) +1
            j=((v%(n * n))//n) +1
            d=(v%n)+1
            solution[i-1][j-1] = d

    return solution
