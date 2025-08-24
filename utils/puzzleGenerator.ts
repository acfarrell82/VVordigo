// VVordigo Puzzle Generator - Translated from Matlab
// Generates NxN word puzzles with gravity-based word removal
import { WORD_DICTIONARY } from './gameLogic';

interface PuzzleState {
  grid: string[][];
  mask: number[][];
  path: number[][][];
}

interface WordDictionary {
  [key: number]: string[];
}

// Convert Set-based dictionary to array-based dictionary for puzzle generation
function createArrayDictionary(): WordDictionary {
  const arrayDict: WordDictionary = {};
  
  // Convert the Set to arrays grouped by length
  for (const word of WORD_DICTIONARY) {
    const length = word.length;
    if (!arrayDict[length]) {
      arrayDict[length] = [];
    }
    arrayDict[length].push(word);
  }
  
  return arrayDict;
}

export interface GeneratedPuzzle {
  grid: string[][];
  solution: string[];
  solutionPaths: number[][][];
  gridSize: number;
}

export class PuzzleGenerator {
  private gridSize: number;
  private minWordLength: number;
  private maxWordLength: number;
  private dictionary: WordDictionary;

  constructor(gridSize: number, minWordLength: number = 3, maxWordLength: number = 6) {
    this.gridSize = gridSize;
    this.minWordLength = minWordLength;
    this.maxWordLength = Math.min(maxWordLength, gridSize);
    this.dictionary = createArrayDictionary();
  }

  // Main puzzle generation function
  generatePuzzle(): GeneratedPuzzle | null {
    const maxAttempts = 100;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const solution = this.selectWords();
        const initialState: PuzzleState = {
          grid: [Array(this.gridSize).fill('').map(() => Array(this.gridSize).fill(''))],
          mask: [Array(this.gridSize).fill(0).map(() => Array(this.gridSize).fill(0))],
          path: Array(solution.length).fill(null).map(() => [])
        };

        const result = this.genPuzzle(initialState, 0, solution);
        
        if (result && this.puzzleIsLegal(result.grid, solution, result.path)) {
          return {
            grid: result.grid[result.grid.length - 1],
            solution,
            solutionPaths: result.path,
            gridSize: this.gridSize
          };
        }
      } catch (error) {
        console.warn(`Puzzle generation attempt ${attempt + 1} failed:`, error);
      }
    }
    
    console.error('Failed to generate valid puzzle after maximum attempts');
    return null;
  }

  // Generate all partitions of N into integers between minVal and maxVal
  private genPartitions(N: number, minVal: number, maxVal: number): number[][] {
    const partitions: number[][] = [];
    
    const helper = (remaining: number, current: number[], minNext: number): void => {
      if (remaining === 0) {
        partitions.push([...current]);
        return;
      }
      
      if (remaining < minNext) {
        return;
      }
      
      for (let k = minNext; k <= Math.min(maxVal, remaining); k++) {
        current.push(k);
        helper(remaining - k, current, k);
        current.pop();
      }
    };
    
    helper(N, [], minVal);
    return partitions;
  }

  // Select words for the puzzle
  private selectWords(): string[] {
    const numLetters = this.gridSize * this.gridSize;
    const partitions = this.genPartitions(numLetters, this.minWordLength, this.maxWordLength);
    
    if (partitions.length === 0) {
      throw new Error('No valid partitions found');
    }
    
    const wordLengths = partitions[Math.floor(Math.random() * partitions.length)];
    const solution: string[] = [];
    
    for (const length of wordLengths) {
      const wordsOfLength = this.dictionary[length];
      if (!wordsOfLength || wordsOfLength.length === 0) {
        throw new Error(`No words of length ${length} available`);
      }
      
      const randomWord = wordsOfLength[Math.floor(Math.random() * wordsOfLength.length)];
      solution.push(randomWord.toUpperCase());
    }
    
    // Shuffle the solution order
    for (let i = solution.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [solution[i], solution[j]] = [solution[j], solution[i]];
    }
    
    return solution;
  }

  // Main recursive puzzle generation
  private genPuzzle(state: PuzzleState, wordIdx: number, solution: string[]): PuzzleState | null {
    if (this.puzzleIsLegal(state.grid, solution, state.path)) {
      return state;
    }
    
    if (wordIdx >= solution.length) {
      return null;
    }
    
    const word = solution[wordIdx];
    const wordLength = word.length;
    
    // Generate random starting positions
    const maxRow = Math.min(Math.max(this.gridSize - wordLength + 1, 1), this.gridSize);
    const validRows = [];
    for (let r = this.gridSize; r >= maxRow; r--) {
      validRows.push(r);
    }
    this.shuffleArray(validRows);
    
    const validCols = [];
    const currentMask = state.mask[state.mask.length - 1];
    for (let c = 0; c < this.gridSize; c++) {
      if (currentMask.some(row => row[c] === 0)) {
        validCols.push(c + 1); // 1-indexed like Matlab
      }
    }
    this.shuffleArray(validCols);
    
    // Try different starting positions
    for (const row of validRows) {
      for (const col of validCols) {
        if (this.puzzleIsLegal(state.grid, solution, state.path)) {
          return state;
        }
        
        // Try to insert first letter
        if (this.letterIsLegal(currentMask, wordIdx + 1, row - 1, col - 1)) { // Convert to 0-indexed
          const newState = this.deepCopyState(state);
          const [newMask, newGrid, newPath] = this.insertLetter(
            currentMask, 
            state.grid[state.grid.length - 1], 
            [], 
            row - 1, 
            col - 1, 
            word[0], 
            wordIdx + 1
          );
          
          newState.mask.push(newMask);
          newState.grid.push(newGrid);
          newState.path[wordIdx] = newPath;
          
          // Generate remaining word
          const wordResult = this.genWord(newState, word, wordIdx + 1, 1);
          
          if (wordResult && this.wordIsLegal(wordResult.mask[wordResult.mask.length - 1], wordIdx + 1, wordLength)) {
            // Try next word
            const puzzleResult = this.genPuzzle(wordResult, wordIdx + 1, solution);
            if (puzzleResult) {
              return puzzleResult;
            }
          }
        }
      }
    }
    
    // Backtrack if no solution found
    return null;
  }

  // Generate word by placing letters sequentially
  private genWord(state: PuzzleState, word: string, wordIdx: number, letterIdx: number): PuzzleState | null {
    const wordLength = word.length;
    
    if (this.wordIsLegal(state.mask[state.mask.length - 1], wordIdx, wordLength)) {
      return state;
    }
    
    if (letterIdx >= wordLength) {
      return state;
    }
    
    const moves = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // down, right, up, left
    const randomMoves = [...moves];
    this.shuffleArray(randomMoves);
    
    const letter = word[letterIdx];
    const currentPath = state.path[wordIdx - 1];
    const lastPos = currentPath[currentPath.length - 1];
    
    for (const [dr, dc] of randomMoves) {
      if (this.wordIsLegal(state.mask[state.mask.length - 1], wordIdx, wordLength)) {
        return state;
      }
      
      const nextRow = lastPos[0] + dr;
      const nextCol = lastPos[1] + dc;
      
      if (this.letterIsLegal(state.mask[state.mask.length - 1], wordIdx, nextRow, nextCol)) {
        const newState = this.deepCopyState(state);
        const [newMask, newGrid, newPath] = this.insertLetter(
          state.mask[state.mask.length - 1],
          state.grid[state.grid.length - 1],
          currentPath,
          nextRow,
          nextCol,
          letter,
          wordIdx
        );
        
        newState.mask.push(newMask);
        newState.grid.push(newGrid);
        newState.path[wordIdx - 1] = newPath;
        
        if (letterIdx === wordLength - 1) {
          if (this.wordIsLegal(newMask, wordIdx, wordLength)) {
            return newState;
          }
        } else {
          const result = this.genWord(newState, word, wordIdx, letterIdx + 1);
          if (result) {
            return result;
          }
        }
      }
    }
    
    return null;
  }

  // Insert letter into grid with gravity effect
  private insertLetter(
    mask: number[][], 
    grid: string[][], 
    path: number[][], 
    nextRow: number, 
    nextCol: number, 
    letter: string, 
    wordIdx: number
  ): [number[][], string[][], number[][]] {
    const newMask = mask.map(row => [...row]);
    const newGrid = grid.map(row => [...row]);
    const newPath = [...path, [nextRow, nextCol]];
    
    // Empty space - simple insertion
    if (newMask[nextRow][nextCol] === 0) {
      newMask[nextRow][nextCol] = wordIdx;
      newGrid[nextRow][nextCol] = letter;
    } else {
      // Occupied space - shift letters up
      const column = newMask.map(row => row[nextCol]);
      const gridColumn = newGrid.map(row => row[nextCol]);
      
      // Find letters that need to shift (not part of current word)
      const lettersToShift = [];
      const staticPositions = new Set();
      
      for (let i = 0; i <= nextRow; i++) {
        if (column[i] === wordIdx) {
          staticPositions.add(i);
        } else if (column[i] !== 0) {
          lettersToShift.push({ pos: i, wordId: column[i], letter: gridColumn[i] });
        }
      }
      
      // Shift non-static letters up
      let insertPos = 0;
      for (const letterInfo of lettersToShift) {
        while (staticPositions.has(insertPos)) {
          insertPos++;
        }
        if (insertPos < nextRow) {
          newMask[insertPos][nextCol] = letterInfo.wordId;
          newGrid[insertPos][nextCol] = letterInfo.letter;
          insertPos++;
        }
      }
      
      // Clear original positions of shifted letters
      for (const letterInfo of lettersToShift) {
        if (letterInfo.pos !== nextRow) {
          newMask[letterInfo.pos][nextCol] = 0;
          newGrid[letterInfo.pos][nextCol] = '';
        }
      }
      
      // Insert new letter
      newMask[nextRow][nextCol] = wordIdx;
      newGrid[nextRow][nextCol] = letter;
    }
    
    return [newMask, newGrid, newPath];
  }

  // Check if letter placement is legal
  private letterIsLegal(mask: number[][], wordIdx: number, nextRow: number, nextCol: number): boolean {
    // Check bounds
    if (nextRow < 0 || nextRow >= this.gridSize || nextCol < 0 || nextCol >= this.gridSize) {
      return false;
    }
    
    // Path cannot intersect itself
    if (mask[nextRow][nextCol] === wordIdx) {
      return false;
    }
    
    // Check if column would overflow
    const occupiedInColumn = mask.reduce((count, row) => count + (row[nextCol] !== 0 ? 1 : 0), 0);
    if (occupiedInColumn + 1 > this.gridSize) {
      return false;
    }
    
    return true;
  }

  // Check if word placement is complete and legal
  private wordIsLegal(mask: number[][], wordIdx: number, wordLength: number): boolean {
    // Count letters placed for this word
    const letterCount = mask.reduce((count, row) => 
      count + row.reduce((rowCount, cell) => rowCount + (cell === wordIdx ? 1 : 0), 0), 0
    );
    
    if (letterCount !== wordLength) {
      return false;
    }
    
    // Check that all letters are properly supported (have something below or are at bottom)
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (mask[r][c] === wordIdx) {
          if (r < this.gridSize - 1 && mask[r + 1][c] === 0) {
            return false; // Letter is floating
          }
        }
      }
    }
    
    return true;
  }

  // Check if entire puzzle is legal and solvable
  private puzzleIsLegal(grids: string[][][], solution: string[], paths: number[][][]): boolean {
    if (grids.length === 0) return false;
    
    const currentGrid = grids[grids.length - 1].map(row => [...row]);
    
    // Check if grid is completely filled
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (!currentGrid[r][c] || currentGrid[r][c] === '') {
          return false;
        }
      }
    }
    
    // Simulate removing words in reverse order
    for (let i = solution.length - 1; i >= 0; i--) {
      const word = solution[i];
      const path = paths[i];
      
      if (!path || path.length !== word.length) {
        return false;
      }
      
      // Verify each letter is in the correct position
      for (let j = 0; j < word.length; j++) {
        const [r, c] = path[j];
        if (currentGrid[r][c] !== word[j]) {
          return false;
        }
        currentGrid[r][c] = '';
      }
      
      // Apply gravity
      for (let c = 0; c < this.gridSize; c++) {
        const column = [];
        for (let r = this.gridSize - 1; r >= 0; r--) {
          if (currentGrid[r][c] && currentGrid[r][c] !== '') {
            column.push(currentGrid[r][c]);
          }
        }
        
        // Clear column
        for (let r = 0; r < this.gridSize; r++) {
          currentGrid[r][c] = '';
        }
        
        // Fill from bottom
        for (let i = 0; i < column.length; i++) {
          currentGrid[this.gridSize - 1 - i][c] = column[i];
        }
      }
    }
    
    return true;
  }

  // Utility functions
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private deepCopyState(state: PuzzleState): PuzzleState {
    return {
      grid: state.grid.map(g => g.map(row => [...row])),
      mask: state.mask.map(m => m.map(row => [...row])),
      path: state.path.map(p => p.map(point => [...point]))
    };
  }
}

// Factory function to generate puzzles for different grid sizes
export function generateDailyPuzzles(minSize: number = 3, maxSize: number = 10): GeneratedPuzzle[] {
  const puzzles: GeneratedPuzzle[] = [];
  
  for (let size = minSize; size <= maxSize; size++) {
    console.log(`Generating ${size}x${size} puzzle...`);
    const generator = new PuzzleGenerator(size, 3, Math.min(6, size));
    const puzzle = generator.generatePuzzle();
    
    if (puzzle) {
      puzzles.push(puzzle);
      console.log(`✓ Generated ${size}x${size} puzzle with ${puzzle.solution.length} words`);
    } else {
      console.warn(`✗ Failed to generate ${size}x${size} puzzle`);
      // Create a fallback simple puzzle
      const fallbackPuzzle = createFallbackPuzzle(size);
      puzzles.push(fallbackPuzzle);
    }
  }
  
  return puzzles;
}

// Create a simple fallback puzzle if generation fails
function createFallbackPuzzle(size: number): GeneratedPuzzle {
  const grid: string[][] = Array(size).fill(null).map(() => Array(size).fill('A'));
  const solution = ['A'.repeat(Math.min(size, 3))];
  const solutionPaths = [[[0, 0], [0, 1], [0, 2]].slice(0, solution[0].length)];
  
  // Fill grid with pattern
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      grid[i][j] = String.fromCharCode(65 + ((i + j) % 26));
    }
  }
  
  return {
    grid,
    solution,
    solutionPaths,
    gridSize: size
  };
}