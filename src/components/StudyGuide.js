import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';
import { BookOpen, Target, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react-native';

const StudyGuide = () => {
  const { currentProject, materials, generateStudyGuide, loading } = useStore();
  const [guide, setGuide] = useState(null);

  const handleGenerate = async () => {
    try {
      const data = await generateStudyGuide();
      setGuide(data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!currentProject || materials.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <BookOpen color="#475569" size={48} />
        <Text style={styles.emptyTitle}>Brak materiałów</Text>
        <Text style={styles.emptySubtitle}>Dodaj materiały, aby AI mogło przygotować Twój plan nauki.</Text>
      </View>
    );
  }

  if (loading && !guide) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Analizuję Twoje materiały... To może chwilę potrwać.</Text>
      </View>
    );
  }

  if (!guide) {
    return (
      <View style={styles.centerContainer}>
        <Sparkles color="#6366f1" size={48} />
        <Text style={styles.emptyTitle}>Twój Plan Nauki</Text>
        <Text style={styles.emptySubtitle}>Kliknij przycisk poniżej, aby AI przygotowało spersonalizowany plan nauki na podstawie Twoich materiałów.</Text>
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
          <Text style={styles.generateButtonText}>Generuj Plan Nauki AI</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Summary Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <BookOpen size={20} color="#6366f1" />
          <Text style={styles.sectionTitle}>Podsumowanie</Text>
        </View>
        <Text style={styles.summaryText}>{guide.summary}</Text>
      </View>

      {/* Key Terms Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Target size={20} color="#10b981" />
          <Text style={styles.sectionTitle}>Kluczowe Pojęcia</Text>
        </View>
        {guide.keyTerms.map((term, index) => (
          <View key={index} style={styles.termItem}>
            <Text style={styles.termLabel}>{term.term || term.word || term.name}</Text>
            <Text style={styles.termDef}>{term.definition || term.desc}</Text>
          </View>
        ))}
      </View>

      {/* Roadmap Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <CheckCircle2 size={20} color="#f59e0b" />
          <Text style={styles.sectionTitle}>Roadmapa Nauki</Text>
        </View>
        {guide.roadmap.map((step, index) => (
          <View key={index} style={styles.roadmapItem}>
            <View style={styles.roadmapDot} />
            <Text style={styles.roadmapText}>
              {typeof step === 'object' ? (step.step || step.description || JSON.stringify(step)) : step}
            </Text>
          </View>
        ))}
      </View>

      {/* Predicted Questions Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AlertCircle size={20} color="#ef4444" />
          <Text style={styles.sectionTitle}>Możesz zostać o to zapytany</Text>
        </View>
        {guide.predictedQuestions.map((q, index) => (
          <View key={index} style={styles.questionItem}>
            <Text style={styles.questionText}>
              • {typeof q === 'object' ? (q.question || q.text || JSON.stringify(q)) : q}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.regenerateButton} onPress={handleGenerate} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#94a3b8" />
        ) : (
          <Text style={styles.regenerateButtonText}>Aktualizuj Plan Nauki</Text>
        )}
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 60,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  generateButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
  },
  generateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 16,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryText: {
    color: '#cbd5e1',
    lineHeight: 22,
    fontSize: 15,
  },
  termItem: {
    marginBottom: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#10b981',
    paddingLeft: 12,
  },
  termLabel: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  termDef: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  roadmapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  roadmapDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },
  roadmapText: {
    color: '#cbd5e1',
    fontSize: 14,
    flex: 1,
  },
  questionItem: {
    marginBottom: 8,
  },
  questionText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  regenerateButton: {
    alignItems: 'center',
    padding: 16,
  },
  regenerateButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  }
});

export default StudyGuide;
