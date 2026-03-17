import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet, Dimensions } from 'react-native';
import { useStore } from '../store/useStore';
import { Brain, RotateCcw, Trash2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const FlashcardsView = () => {
  const { flashcards, loading, generateFlashcards, deleteFlashcard } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleGenerate = async () => {
    try {
      await generateFlashcards();
    } catch (error) {
      Alert.alert('Błąd', error.message || 'Nie udało się wygenerować fiszek.');
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Usuń fiszkę',
      'Czy na pewno chcesz usunąć tę fiszkę?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { 
          text: 'Usuń', 
          style: 'destructive', 
          onPress: async () => {
            const isLast = currentIndex === flashcards.length - 1;
            await deleteFlashcard(id);
            if (isLast && currentIndex > 0) {
              setCurrentIndex(currentIndex - 1);
            }
            setIsFlipped(false);
          } 
        }
      ]
    );
  };

  if (loading && flashcards.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Generuję fiszki z Twoich materiałów...</Text>
      </View>
    );
  }

  if (flashcards.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Brain color="#334155" size={64} strokeWidth={1} />
        <Text style={styles.emptyTitle}>Brak fiszek</Text>
        <Text style={styles.emptySubtitle}>
          Kliknij poniższy przycisk, aby AI stworzyło fiszki na podstawie Twoich materiałów w tym projekcie.
        </Text>
        <TouchableOpacity 
          style={styles.generateButton} 
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Sparkles color="white" size={20} />
              <Text style={styles.generateButtonText}>Generuj fiszki AI</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  const currentCard = flashcards[currentIndex];

  if (!currentCard) {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.progressText}>
          Fiszka {currentIndex + 1} z {flashcards.length}
        </Text>
        <TouchableOpacity onPress={() => handleDelete(currentCard.id)}>
          <Trash2 color="#ef4444" size={20} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        activeOpacity={0.9} 
        style={styles.cardContainer}
        onPress={() => setIsFlipped(!isFlipped)}
      >
        <View style={[styles.card, isFlipped ? styles.cardBack : styles.cardFront]}>
          <Text style={styles.cardLabel}>
            {isFlipped ? 'ODPOWIEDŹ' : 'PYTANIE'}
          </Text>
          <Text style={styles.cardText}>
            {isFlipped ? currentCard.answer : currentCard.question}
          </Text>
          <View style={styles.flipHint}>
            <RotateCcw color="#94a3b8" size={16} />
            <Text style={styles.flipHintText}>Kliknij, aby odwrócić</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.navButton, currentIndex === 0 && styles.disabledButton]} 
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft color={currentIndex === 0 ? '#475569' : 'white'} size={24} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Sparkles color="white" size={20} />
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navButton, currentIndex === flashcards.length - 1 && styles.disabledButton]} 
          onPress={handleNext}
          disabled={currentIndex === flashcards.length - 1}
        >
          <ChevronRight color={currentIndex === flashcards.length - 1 ? '#475569' : 'white'} size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 20,
  },
  generateButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
  },
  generateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  progressText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  cardContainer: {
    height: width * 1.1,
    width: '100%',
    perspective: 1000,
  },
  card: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 32,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardFront: {
    borderLeftWidth: 6,
    borderLeftColor: '#6366f1',
  },
  cardBack: {
    borderLeftWidth: 6,
    borderLeftColor: '#10b981',
    backgroundColor: '#1e293b', 
  },
  cardLabel: {
    position: 'absolute',
    top: 30,
    color: '#475569',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  cardText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 34,
  },
  flipHint: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flipHintText: {
    color: '#64748b',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 30,
  },
  navButton: {
    backgroundColor: '#334155',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  refreshButton: {
    backgroundColor: '#6366f1',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  }
});

export default FlashcardsView;
