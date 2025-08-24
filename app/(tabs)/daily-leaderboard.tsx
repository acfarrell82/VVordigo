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
import { ChevronLeft, ChevronRight, Trophy, Medal, Award } from 'lucide-react-native';

interface LeaderboardEntry {
  rank: number;
  username: string;
  time: number;
  score: number;
}

const MOCK_LEADERBOARD_DATA: { [key: number]: LeaderboardEntry[] } = {
  3: [
    { rank: 1, username: 'WordMaster', time: 45, score: 1200 },
    { rank: 2, username: 'PuzzleKing', time: 52, score: 1150 },
    { rank: 3, username: 'LetterLord', time: 58, score: 1100 },
    { rank: 4, username: 'GridGuru', time: 63, score: 1050 },
    { rank: 5, username: 'WordWiz', time: 67, score: 1000 },
  ],
  4: [
    { rank: 1, username: 'GridMaster', time: 120, score: 2400 },
    { rank: 2, username: 'WordHero', time: 135, score: 2300 },
    { rank: 3, username: 'PuzzlePro', time: 142, score: 2200 },
    { rank: 4, username: 'LetterLegend', time: 158, score: 2100 },
    { rank: 5, username: 'WordWarrior', time: 165, score: 2000 },
  ],
};

export default function DailyLeaderboardScreen() {
  const [currentGridSize, setCurrentGridSize] = useState(3);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboardData();
  }, [currentGridSize]);

  const loadLeaderboardData = () => {
    // Simulate API call
    setTimeout(() => {
      setLeaderboardData(MOCK_LEADERBOARD_DATA[currentGridSize] || []);
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
        <Text style={styles.title}>Daily Leaderboard</Text>
        <Text style={styles.subtitle}>Today's Top Players</Text>
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
                Time: {formatTime(entry.time)} • Score: {entry.score}
              </Text>
            </View>

            <View style={styles.scoreContainer}>
              <Text style={styles.timeText}>{formatTime(entry.time)}</Text>
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
                Time: {formatTime(180 + rank * 5)} • Score: {Math.max(500, 1200 - rank * 10)}
              </Text>
            </View>

            <View style={styles.scoreContainer}>
              <Text style={styles.timeText}>{formatTime(180 + rank * 5)}</Text>
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
    marginBottom: 30,
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
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
});