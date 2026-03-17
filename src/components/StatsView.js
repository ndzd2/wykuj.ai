import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { useStore } from '../store/useStore';
import { BookOpen, CheckCircle2, Trophy, Brain } from 'lucide-react-native';

const StatsView = () => {
  const { stats, fetchStats } = useStore();

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>Twoje Postępy</Text>
      
      <View style={styles.statsGrid}>
        <StatCard 
          icon={<BookOpen color="#6366f1" size={24} />}
          label="Materiały"
          value={stats.materialsCount}
          color="#6366f1"
        />
        <StatCard 
          icon={<Brain color="#10b981" size={24} />}
          label="Fiszki"
          value={stats.learnedFlashcards}
          color="#10b981"
        />
        <StatCard 
          icon={<CheckCircle2 color="#f59e0b" size={24} />}
          label="Quizy"
          value={stats.completedQuizzes}
          color="#f59e0b"
        />
        <StatCard 
          icon={<Trophy color="#ec4899" size={24} />}
          label="Poziom"
          value={Math.floor((stats.materialsCount + stats.learnedFlashcards + stats.completedQuizzes) / 10) + 1}
          color="#ec4899"
        />
      </View>

      <View style={styles.motivationCard}>
        <Text style={styles.motivationTitle}>Dobra robota! 🔥</Text>
        <Text style={styles.motivationSubtitle}>
          Każda minuta nauki przybliża Cię do celu. Nie przestawaj!
        </Text>
      </View>
    </ScrollView>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <View style={styles.card}>
    <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
      {icon}
    </View>
    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 4,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  cardValue: { color: 'white', fontSize: 24, fontWeight: '900', marginBottom: 4 },
  cardLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  motivationCard: {
    backgroundColor: '#312e81',
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  motivationTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  motivationSubtitle: { color: '#c7d2fe', fontSize: 14, lineHeight: 20 },
});

export default StatsView;
