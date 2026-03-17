import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Brain, FileQuestion } from 'lucide-react-native';
import FlashcardsView from './FlashcardsView';
import QuizView from './QuizView';

const StudyModule = () => {
  const [mode, setMode] = useState('menu'); // 'menu', 'flashcards', 'quiz'

  if (mode === 'flashcards') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.backButton} onPress={() => setMode('menu')}>
          <Text style={styles.backButtonText}>← Powrót do menu</Text>
        </TouchableOpacity>
        <FlashcardsView />
      </View>
    );
  }

  if (mode === 'quiz') {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.backButton} onPress={() => setMode('menu')}>
          <Text style={styles.backButtonText}>← Powrót do menu</Text>
        </TouchableOpacity>
        <QuizView />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Co chcesz dzisiaj robić?</Text>
      
      <TouchableOpacity 
        style={styles.optionCard} 
        onPress={() => setMode('flashcards')}
      >
        <View style={[styles.iconContainer, { backgroundColor: '#6366f120' }]}>
          <Brain color="#6366f1" size={32} />
        </View>
        <View style={styles.optionInfo}>
          <Text style={styles.optionTitle}>Fiszki AI</Text>
          <Text style={styles.optionDescription}>Szybkie powtórki pojęć i definicji.</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.optionCard} 
        onPress={() => setMode('quiz')}
      >
        <View style={[styles.iconContainer, { backgroundColor: '#10b98120' }]}>
          <FileQuestion color="#10b981" size={32} />
        </View>
        <View style={styles.optionInfo}>
          <Text style={styles.optionTitle}>Quizy AI</Text>
          <Text style={styles.optionDescription}>Sprawdź swoją wiedzę w testach wyboru.</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    gap: 16,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  optionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  optionDescription: {
    color: '#94a3b8',
    fontSize: 14,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: '#6366f1',
    fontWeight: '600',
  }
});

export default StudyModule;
