import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedGestureHandler, runOnJS, useSharedValue as useSharedValueImport } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { RotateCcw, Lightbulb, Undo2, Play } from 'lucide-react-native';
import { PuzzleGenerator, generateDailyPuzzles, GeneratedPuzzle } from '@/utils/puzzleGenerator';
import { 
  initializeGameFromPuzzle, 
  isValidWord, 
  applyGravity, 
  removeSelectedBlocks, 
  isGameComplete, 
  areBlocksAdjacent, 
  isValidWordPath, 
  getHint, 
  canUndoLastMove, 
  undoLastMove, 
  formatTime, 
  calculateScore,
  GameBlock,
  GameState 
} from '@/utils/gameLogic';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function PlayScreen() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gridData, setGridData] = useState<GameBlock[][]>([]);
  const [dailyPuzzles, setDailyPuzzles] = useState<GeneratedPuzzle[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [selectedBlocks, setSelectedBlocks] = useState<GameBlock[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [isGestureActive, setIsGestureActive] = useState(false);

  // Shared values for gesture handler access
  const gestureSelectedBlocks = useSharedValue<GameBlock[]>([]);
  const gestureCurrentWord = useSharedValue('');

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [playerRanking, setPlayerRanking] = useState(0);
  const [isGeneratingPuzzle, setIsGeneratingPuzzle] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const gridRef = useRef<View>(null);
  const blockSize = gameState ? Math.min((screenWidth - 40) / gameState.gridSize, 60) : 60;
  const gridWidth = gameState ? blockSize * gameState.gridSize + (gameState.gridSize - 1) * 4 : 0;
  const gridHeight = gameState ? blockSize * gameState.gridSize + (gameState.gridSize - 1) * 4 : 0;

  const initializePuzzles = async () => {
    setIsGeneratingPuzzle(true);
    try {
      console.log('Generating daily puzzles...');
      const puzzles = generateDailyPuzzles(3, 5);
      setDailyPuzzles(puzzles);
      
      if (puzzles.length > 0) {
        const initialGameState = initializeGameFromPuzzle(puzzles[0]);
        setGameState(initialGameState);
        setGridData(initialGameState.grid);
        startTimer();
      }
    } catch (error) {
      console.error('Failed to generate puzzles:', error);
      Alert.alert('Error', 'Failed to generate puzzles. Please try again.');
    } finally {
      setIsGeneratingPuzzle(false);
    }
  };

  useEffect(() => {
    initializePuzzles();
  }, []);

  const handleWordSubmission = (word: string, blocks: GameBlock[]) => {
    if (!gameState || blocks.length < 3) {
      return;
    }

    if (isValidWord(word)) {
      const newGrid = removeSelectedBlocks(gameState.grid, blocks);
      const newGameState = {
        ...gameState,
        grid: newGrid,
        score: gameState.score + calculateScore(blocks.length),
        removedWords: [...gameState.removedWords, word],
        gameHistory: [...gameState.gameHistory, newGrid.map(row => row.map(block => ({ ...block })))]
      };
      
      setGameState(newGameState);
      setGridData(newGrid);
      
      if (isGameComplete(newGrid)) {
        stopTimer();
        setShowRanking(true);
        setPlayerRanking(Math.floor(Math.random() * 100) + 1);
      }
    } else {
    }
  };

  // Convert touch coordinates to grid position
  const getBlockFromCoordinates = (x: number, y: number): GameBlock | null => {
    if (!gameState) return null;
    
    const blockWithSpacing = blockSize + 4;
    const col = Math.floor(x / blockWithSpacing);
    const row = Math.floor(y / blockWithSpacing);
    
    if (row >= 0 && row < gameState.gridSize && col >= 0 && col < gameState.gridSize) {
      const block = gridData[row][col];
      return block.letter ? block : null;
    }
    
    return null;
  };

  // Handle gesture-based selection
  const handleGestureSelection = (x: number, y: number) => {
    const block = getBlockFromCoordinates(x, y);
    if (!block) return;
    
    setSelectedBlocks(current => {
      const blockIndex = current.findIndex(b => b.id === block.id);
      
      if (blockIndex !== -1) {
        // Block is already selected - check if we should backtrack
        if (blockIndex === current.length - 1) {
          // This is the last block, don't change selection
          return current;
        } else {
          // Backtrack to this block (remove all blocks after it)
          const newSelection = current.slice(0, blockIndex + 1);
          const newWord = newSelection.map(b => b.letter).join('');
          setCurrentWord(newWord);
          gestureSelectedBlocks.value = newSelection;
          gestureCurrentWord.value = newWord;
          return newSelection;
        }
      } else {
        // New block - check if it's adjacent to the last selected block
        if (current.length === 0) {
          // First block
          setCurrentWord(block.letter);
          gestureSelectedBlocks.value = [block];
          gestureCurrentWord.value = block.letter;
          return [block];
        } else {
          const lastBlock = current[current.length - 1];
          if (areBlocksAdjacent(lastBlock, block)) {
            const newSelection = [...current, block];
            const newWord = newSelection.map(b => b.letter).join('');
            setCurrentWord(newWord);
            gestureSelectedBlocks.value = newSelection;
            gestureCurrentWord.value = newWord;
            return newSelection;
          }
        }
      }
      
      return current;
    });
  };

  // Gesture handler
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (event) => {
      runOnJS(setIsGestureActive)(true);
      gestureSelectedBlocks.value = [];
      gestureCurrentWord.value = '';
      runOnJS(handleGestureSelection)(event.x, event.y);
    },
    onActive: (event) => {
      runOnJS(handleGestureSelection)(event.x, event.y);
    },
    onEnd: () => {
      runOnJS(setIsGestureActive)(false);
      
      const blocksToSubmit = gestureSelectedBlocks.value;
      const wordToSubmit = gestureCurrentWord.value;
      
      // Always clear selection first
      runOnJS(setSelectedBlocks)([]);
      runOnJS(setCurrentWord)('');
      
      // Only submit if we have at least 2 letters (moved to at least one other letter)
      if (blocksToSubmit.length >= 2 && wordToSubmit.length >= 3) {
        runOnJS(handleWordSubmission)(wordToSubmit, blocksToSubmit);
      }
    },
  });


  const handleBlockPress = (block: GameBlock) => {
    // Disable tap selection when gesture is active
    if (isGestureActive) return;
    
    if (!gameState) return;
    
    setSelectedBlocks(current => {
      const isAlreadySelected = current.some(b => b.id === block.id);
      
      if (isAlreadySelected) {
        // Only allow deselecting the last letter in the sequence
        const lastBlock = current[current.length - 1];
        if (lastBlock && lastBlock.id === block.id) {
          const newSelection = current.slice(0, -1);
          setCurrentWord(newSelection.map(b => b.letter).join(''));
          return newSelection;
        }
        // If it's not the last letter, don't change selection
        return current;
      } else {
        if (current.length === 0 || areBlocksAdjacent(current[current.length - 1], block)) {
          const newSelection = [...current, block];
          if (isValidWordPath(newSelection)) {
            setCurrentWord(newSelection.map(b => b.letter).join(''));
            return newSelection;
          }
        }
      }
      return current;
    });
  };

  const handleSubmitWord = () => {
    if (selectedBlocks.length >= 3) {
      handleWordSubmission(currentWord, selectedBlocks);
    }
    
    setSelectedBlocks([]);
    setCurrentWord('');
  };

  const isBlockSelected = (block: GameBlock): boolean => {
    return selectedBlocks.some(b => b.id === block.id);
  };

  const BlockComponent = ({ 
    block,
    onPress
  }: { 
    block: GameBlock;
    onPress: () => void;
  }) => {
    const isSelected = isBlockSelected(block);

    return (
      <View style={[styles.block, { width: blockSize, height: blockSize }]}>
        <TouchableOpacity
          onPress={onPress}
          style={styles.blockTouchable}
          disabled={isGestureActive}
        >
          <LinearGradient
            colors={isSelected ? ['#87CEEB', '#4FC3F7'] : ['#F1F5F9', '#E2E8F0']}
            style={styles.blockGradient}
          >
            <Text style={[styles.blockText, { fontSize: blockSize * 0.4, color: isSelected ? '#FFFFFF' : '#1E293B' }]}>
              {block.letter}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const handleRestart = () => {
    if (!dailyPuzzles[currentPuzzleIndex]) return;
    
    const newGameState = initializeGameFromPuzzle(dailyPuzzles[currentPuzzleIndex]);
    setGameState(newGameState);
    setGridData(newGameState.grid);
    setSelectedBlocks([]);
    setCurrentWord('');
    setShowRanking(false);
    startTimer();
  };

  const handleNextPuzzle = () => {
    const nextIndex = currentPuzzleIndex + 1;
    if (nextIndex < dailyPuzzles.length) {
      setCurrentPuzzleIndex(nextIndex);
      const newGameState = initializeGameFromPuzzle(dailyPuzzles[nextIndex]);
      setGameState(newGameState);
      setGridData(newGameState.grid);
      setSelectedBlocks([]);
      setCurrentWord('');
      setShowRanking(false);
      startTimer();
    } else {
      Alert.alert('Congratulations!', 'You have completed all puzzles for today!');
    }
  };

  const handleUndo = () => {
    if (!gameState || !canUndoLastMove(gameState.gameHistory)) return;
    
    const previousGrid = undoLastMove(gameState.gameHistory);
    const newGameHistory = gameState.gameHistory.slice(0, -1);
    const newGameState = {
      ...gameState,
      grid: previousGrid,
      gameHistory: newGameHistory,
      // Also revert the score and removed words if we're undoing a successful word
      score: newGameHistory.length < gameState.gameHistory.length - 1 ? 
        Math.max(0, gameState.score - calculateScore(gameState.removedWords[gameState.removedWords.length - 1]?.length || 0)) : 
        gameState.score,
      removedWords: newGameHistory.length < gameState.gameHistory.length - 1 ? 
        gameState.removedWords.slice(0, -1) : 
        gameState.removedWords
    };
    
    setGameState(newGameState);
    setGridData(previousGrid);
    setSelectedBlocks([]);
    setCurrentWord('');
  };

  const handleHint = () => {
    if (!gameState) return;
    
    Alert.alert(
      'Use Hint',
      'This puzzle will not be scored. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            const hint = getHint(gameState.grid, gameState.solution, gameState.solutionPaths, gameState.removedWords);
            if (hint) {
              Alert.alert('Hint', `Try finding "${hint.word}" in the grid!`);
            } else {
              Alert.alert('Hint', 'No hint available for this puzzle state.');
            }
          }
        }
      ]
    );
  };

  const startTimer = () => {
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
  };

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setGameState(prev => prev ? { ...prev, timer: prev.timer + 1 } : null);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  if (isGeneratingPuzzle) {
    return (
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Generating Today's Puzzles...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!gameState) {
    return (
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (showRanking) {
    return (
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
        <View style={styles.rankingContainer}>
          <Text style={styles.rankingTitle}>Puzzle Complete!</Text>
          <Text style={styles.rankingTime}>Time: {formatTime(gameState.timer)}</Text>
          <Text style={styles.rankingPosition}>Your Ranking: #{playerRanking}</Text>
          <Text style={styles.rankingScore}>Score: {gameState.score}</Text>
          
          <TouchableOpacity style={styles.nextButton} onPress={handleNextPuzzle}>
            <Play size={20} color="#FFFFFF" />
            <Text style={styles.nextButtonText}>Next Puzzle</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      {/* Timer and Puzzle Info */}
      <View style={styles.headerContainer}>
        <Text style={styles.timerText}>{formatTime(gameState.timer)}</Text>
        <Text style={styles.puzzleInfo}>
          Puzzle {currentPuzzleIndex + 1} • {gameState.gridSize}×{gameState.gridSize}
        </Text>
      </View>

      {/* Game Grid */}
      <View style={styles.gameContainer}>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View>
            <View 
              ref={gridRef}
              style={[styles.grid, { 
                width: gridWidth,
                height: gridHeight
              }]}
            >
              {gridData.map((row, rowIndex) =>
                <View key={`row-${rowIndex}`} style={styles.gridRow}>
                  {row.map((block, colIndex) =>
                    block.letter ? (
                      <BlockComponent
                        key={block.id}
                        block={block}
                        onPress={() => handleBlockPress(block)}
                      />
                    ) : (
                      <View key={`empty-${rowIndex}-${colIndex}`} style={[styles.emptyBlock, { width: blockSize, height: blockSize }]} />
                    )
                  )}
                </View>
              )}
            </View>
          </Animated.View>
        </PanGestureHandler>

      </View>

      {/* Controls */}
      <View style={styles.controlsWrapper}>
        {/* Controls Row */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={handleRestart}>
            <RotateCcw size={20} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Restart</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, !canUndoLastMove(gameState?.gameHistory || []) && styles.controlButtonDisabled]} 
            onPress={handleUndo}
            disabled={!canUndoLastMove(gameState?.gameHistory || [])}
          >
            <Undo2 size={20} color={canUndoLastMove(gameState?.gameHistory || []) ? "#FFFFFF" : "#64748B"} />
            <Text style={[styles.controlButtonText, !canUndoLastMove(gameState?.gameHistory || []) && styles.controlButtonTextDisabled]}>Undo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleHint}>
            <Lightbulb size={20} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Hint</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  puzzleInfo: {
    fontSize: 16,
    color: '#94A3B8',
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  grid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  block: {
    marginHorizontal: 2,
  },
  emptyBlock: {
    marginHorizontal: 2,
  },
  blockTouchable: {
    width: '100%',
    height: '100%',
  },
  blockGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  blockText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  controlsWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  controlButtonTextDisabled: {
    color: '#64748B',
  },
  rankingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  rankingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  rankingTime: {
    fontSize: 24,
    color: '#3B82F6',
    marginBottom: 10,
  },
  rankingPosition: {
    fontSize: 20,
    color: '#10B981',
    marginBottom: 10,
  },
  rankingScore: {
    fontSize: 18,
    color: '#F59E0B',
    marginBottom: 40,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});