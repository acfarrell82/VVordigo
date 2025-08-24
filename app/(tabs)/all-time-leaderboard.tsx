import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, Trophy, Medal, Award, Clock, Target } from 'lucide-react-native';

interface AllTimeEntry {
  rank: number;
  username: string;
  averageTime?: number;
  totalPuzzles?: number;
  totalScore: number;
}

const MOCK_AVERAGE_TIME_DATA: { [key: number]: AllTimeEntry[] } = {
  3: [
    { rank: 1, username: 'SpeedDemon', averageTime: 42, totalScore: 15000 },
    { rank: 2, username: 'QuickSolver', averageTime: 48, totalScore: 14500 },
    { rank: 3, username: 'FastFinisher', averageTime: 51, totalScore: 14000 },
    { rank: 4, username: 'RapidReader', averageTime: 55, totalScore: 13500 },
    { rank: 5, username: 'SwiftSolver', averageTime: 58, totalScore: 13000 },
  ],
  4: [
    { rank: 1, username: 'GridMaster', averageTime: 115, totalScore: 25000 },
    { rank: 2, username: 'PuzzlePro', averageTime: 125, totalScore: 24000 },
    { rank: 3, username: 'WordWizard', averageTime: 132, totalScore: 23000 },
    { rank: 4, username: 'LetterLord', averageTime: 138, totalScore: 22000 },
    { rank: 5, username: 'GridGuru', averageTime: 145, totalScore: 21000 },
  ],
};

const MOCK_TOTAL_PUZZLES_DATA: { [key: number]: AllTimeEntry[] } = {
  3: [
    { rank: 1, username: 'PuzzleAddict', totalPuzzles: 500, totalScore: 50000 },
    { rank: 2, username: 'WordHunter', totalPuzzles: 485, totalScore: 48500 },
    { rank: 3, username: 'GridExplorer', totalPuzzles: 472, totalScore: 47200 },
    { rank: 4, username: 'LetterSeeker', totalPuzzles: 458, totalScore: 45800 },
    { rank: 5, username: 'WordChaser', totalPuzzles: 445, totalScore: 44500 },
  ],
  4: [
    { rank: 1, username: 'PuzzleKing', totalPuzzles: 350, totalScore: 70000 },
    { rank: 2, username: 'GridChampion', totalPuzzles: 335, totalScore: 67000 },
    { rank: 3, username: 'WordMaster', totalPuzzles: 322, totalScore: 64400 },
    { rank: 4, username: 'LetterLegend', totalPuzzles: 308, totalScore: 61600 },
    { rank: 5, username: 'PuzzleHero', totalPuzzles: 295, totalScore: 59000 },
  ],
};

type LeaderboardType = 'averageTime' | 'totalPuzzles';

export default function AllTimeLeaderboardScreen() {
  const [currentGridSize, setCurrentGridSize] = useState(3);
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('averageTime');
  const [leaderboardData, setLeaderboardData] = useState<AllTimeEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboardData();
  }, [currentGridSize, leaderboardType]);

  const loadLeaderboardData = () => {
    setTimeout(() => {
      const data = leaderboardType === 'averageTime' 
        ? MOCK_AVERAGE_TIME_DATA[currentGridSize] || []
        : MOCK_TOTAL_PUZZLES_DATA[currentGridSize] || [];
      setLeaderboardData(data);
    }, 500);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      loadLeaderboardData();
      setRefreshing(false);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={24} color="#FFD700" />;
      case 2:
        return <Medal size={24} color="#C0C0C0" />;
      case 3:
        return <Award size={24} color="#CD7F32" />;
      default:
        return (
          <View style={styles.rankNumber}>
            <Text style={styles.rankNumberText}>{rank}</Text>
          </View>
        );
    }
  };

  const navigateGridSize = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentGridSize > 3) {
      setCurrentGridSize(currentGridSize - 1);
    } else if (direction === 'next' && currentGridSize < 10) {
      setCurrentGridSize(currentGridSize + 1);
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>All-Time Leaderboard</Text>
        <Text style={styles.subtitle}>Hall of Fame</Text>
      </View>

      {/* Leaderboard Type Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            leaderboardType === 'averageTime' && styles.toggleButtonActive
          ]}
          onPress={() => setLeaderboardType('averageTime')}
        >
          <Clock size={16} color={leaderboardType === 'averageTime' ? '#FFFFFF' : '#94A3B8'} />
          <Text style={[
            styles.toggleButtonText,
            leaderboardType === 'averageTime' && styles.toggleButtonTextActive
          ]}>
            Average Time
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            leaderboardType === 'totalPuzzles' && styles.toggleButtonActive
          ]}
          onPress={() => setLeaderboardType('totalPuzzles')}
        >
          <Target size={16} color={leaderboardType === 'totalPuzzles' ? '#FFFFFF' : '#94A3B8'} />
          <Text style={[
            styles.toggleButtonText,
            leaderboardType === 'totalPuzzles' && styles.toggleButtonTextActive
          ]}>
            Total Puzzles
          </Text>
        </TouchableOpacity>
      </View>

      {/* Grid Size Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentGridSize <= 3 && styles.navButtonDisabled]}
          onPress={() => navigateGridSize('prev')}
          disabled={currentGridSize <= 3}
        >
          <ChevronLeft size={20} color={currentGridSize <= 3 ? '#64748B' : '#FFFFFF'} />
        </TouchableOpacity>

        <View style={styles.gridSizeContainer}>
          <Text style={styles.gridSizeText}>{currentGridSize}×{currentGridSize}</Text>
          <Text style={styles.gridSizeLabel}>Grid</Text>
        </View>

        <TouchableOpacity
          style={[styles.navButton, currentGridSize >= 10 && styles.navButtonDisabled]}
          onPress={() => navigateGridSize('next')}
          disabled={currentGridSize >= 10}
        >
          <ChevronRight size={20} color={currentGridSize >= 10 ? '#64748B' : '#FFFFFF'} />
        </TouchableOpacity>
      </View>

      {/* Leaderboard */}
      <ScrollView
        style={styles.leaderboardContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {leaderboardData.map((entry, index) => (
          <View key={entry.rank} style={styles.leaderboardEntry}>
            <View style={styles.rankContainer}>
              {getRankIcon(entry.rank)}
            </View>

            <View style={styles.playerInfo}>
              <Text style={styles.username}>{entry.username}</Text>
              <Text style={styles.playerStats}>
                {leaderboardType === 'averageTime' 
                  ? `Avg: ${formatTime(entry.averageTime!)} • Score: ${entry.totalScore.toLocaleString()}`
                  : `Puzzles: ${entry.totalPuzzles} • Score: ${entry.totalScore.toLocaleString()}`
                }
              </Text>
            </View>

            <View style={styles.scoreContainer}>
              <Text style={styles.statText}>
                {leaderboardType === 'averageTime' 
                  ? formatTime(entry.averageTime!)
                  : entry.totalPuzzles?.toString()
                }
              </Text>
            </View>
          </View>
        ))}

        {/* Generate more entries for scrolling */}
        {Array.from({ length: 95 }, (_, i) => i + 6).map((rank) => (
          <View key={rank} style={styles.leaderboardEntry}>
            <View style={styles.rankContainer}>
              <View style={styles.rankNumber}>
                <Text style={styles.rankNumberText}>{rank}</Text>
              </View>
            </View>

            <View style={styles.playerInfo}>
              <Text style={styles.username}>Player{rank}</Text>
              <Text style={styles.playerStats}>
                {leaderboardType === 'averageTime' 
                  ? `Avg: ${formatTime(60 + rank * 2)} • Score: ${Math.max(1000, 15000 - rank * 100)}`
                  : `Puzzles: ${Math.max(50, 500 - rank * 5)} • Score: ${Math.max(5000, 50000 - rank * 500)}`
                }
              </Text>
            </View>

            <View style={styles.scoreContainer}>
              <Text style={styles.statText}>
                {leaderboardType === 'averageTime' 
                  ? formatTime(60 + rank * 2)
                  : Math.max(50, 500 - rank * 5).toString()
                }
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#3B82F6',
  },
  toggleButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  navButton: {
    padding: 10,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  navButtonDisabled: {
    backgroundColor: '#1F2937',
  },
  gridSizeContainer: {
    alignItems: 'center',
    marginHorizontal: 30,
    minWidth: 80,
  },
  gridSizeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  gridSizeLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  leaderboardContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  playerStats: {
    fontSize: 12,
    color: '#94A3B8',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
});