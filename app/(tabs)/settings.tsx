import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, BellOff, User, LogOut, Info, Shield, CircleHelp as HelpCircle } from 'lucide-react-native';

interface SettingsState {
  notificationsEnabled: boolean;
  isLoggedIn: boolean;
  username: string;
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SettingsState>({
    notificationsEnabled: true,
    isLoggedIn: false,
    username: 'Guest',
  });

  useEffect(() => {
    // Load settings from storage
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // In production, load from AsyncStorage or secure storage
    // For now, using mock data
    setSettings(prev => ({
      ...prev,
      isLoggedIn: false,
      username: 'Guest',
    }));
  };

  const saveSettings = async (newSettings: Partial<SettingsState>) => {
    // In production, save to AsyncStorage or secure storage
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleNotifications = (value: boolean) => {
    saveSettings({ notificationsEnabled: value });
  };

  const handleLogin = () => {
    Alert.alert(
      'Login',
      'Choose your login method',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Google', onPress: () => handleSocialLogin('google') },
        { text: 'Apple', onPress: () => handleSocialLogin('apple') },
        { text: 'Email', onPress: () => handleEmailLogin() },
      ]
    );
  };

  const handleSocialLogin = (provider: string) => {
    // Mock social login
    Alert.alert('Login', `${provider} login would be implemented here`);
  };

  const handleEmailLogin = () => {
    Alert.alert('Email Login', 'Email/password login would be implemented here');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            saveSettings({ isLoggedIn: false, username: 'Guest' });
          }
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About VVordigo',
      'VVordigo v1.0.0\n\nA challenging word puzzle game where you clear blocks by finding words in a grid. Watch as gravity takes effect when words are removed!\n\nDeveloped with ❤️ for word puzzle enthusiasts.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'Your privacy is important to us. We collect minimal data necessary for gameplay and leaderboards. No personal information is shared with third parties.',
      [{ text: 'OK' }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'How to Play',
      '1. Slide your finger across letters to form words\n2. Valid words will disappear with a gravity effect\n3. Clear all blocks to complete the puzzle\n4. Compete for the best time on leaderboards!\n\nTips:\n• Start with longer words when possible\n• Plan ahead - order matters!\n• Use hints if you get stuck',
      [{ text: 'Got it!' }]
    );
  };

  const SettingRow = ({ 
    icon, 
    title, 
    subtitle, 
    rightComponent, 
    onPress 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    rightComponent?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={styles.settingRow} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent && (
        <View style={styles.settingRight}>
          {rightComponent}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your VVordigo experience</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <SettingRow
            icon={<User size={20} color="#3B82F6" />}
            title={settings.isLoggedIn ? settings.username : 'Login'}
            subtitle={settings.isLoggedIn ? 'Logged in' : 'Sign in to save progress and compete'}
            rightComponent={
              settings.isLoggedIn ? (
                <TouchableOpacity onPress={handleLogout}>
                  <LogOut size={20} color="#EF4444" />
                </TouchableOpacity>
              ) : undefined
            }
            onPress={settings.isLoggedIn ? undefined : handleLogin}
          />
        </View>

        {/* Game Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Settings</Text>
          
          <SettingRow
            icon={settings.notificationsEnabled ? 
              <Bell size={20} color="#3B82F6" /> : 
              <BellOff size={20} color="#64748B" />
            }
            title="Notifications"
            subtitle="Get notified when new puzzles are available"
            rightComponent={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#374151', true: '#3B82F6' }}
                thumbColor={settings.notificationsEnabled ? '#FFFFFF' : '#9CA3AF'}
              />
            }
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <SettingRow
            icon={<HelpCircle size={20} color="#F59E0B" />}
            title="How to Play"
            subtitle="Learn the rules and get tips"
            onPress={handleHelp}
          />

          <SettingRow
            icon={<Info size={20} color="#8B5CF6" />}
            title="About"
            subtitle="App version and information"
            onPress={handleAbout}
          />

          <SettingRow
            icon={<Shield size={20} color="#06B6D4" />}
            title="Privacy Policy"
            subtitle="How we handle your data"
            onPress={handlePrivacy}
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>VVordigo v1.0.0</Text>
          <Text style={styles.appInfoText}>Made with ❤️ for word puzzle lovers</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  scrollContainer: {
    flex: 1,
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
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  settingRight: {
    marginLeft: 15,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 5,
  },
});