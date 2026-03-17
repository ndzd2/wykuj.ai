import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, Modal } from 'react-native';
import { useStore } from '../store/useStore';
import { FileQuestion, Plus, Trash2, Clock, BarChart3, ChevronRight, Sparkles } from 'lucide-react-native';
import QuizRunner from './QuizRunner';

const QuizView = () => {
  const { quizzes, loading, generateQuiz, deleteQuiz } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [lengthModalVisible, setLengthModalVisible] = useState(false);

  const handleCreateQuiz = async (count) => {
    setLengthModalVisible(false);
    setIsGenerating(true);
    try {
      const quizId = await generateQuiz(count);
      setSelectedQuizId(quizId);
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się wygenerować quizu.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Usuń quiz',
      'Czy na pewno chcesz usunąć ten quiz z historią?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Usuń', style: 'destructive', onPress: () => deleteQuiz(id) }
      ]
    );
  };

  if (selectedQuizId) {
    return <QuizRunner quizId={selectedQuizId} onFinish={() => setSelectedQuizId(null)} />;
  }

  if (isGenerating) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>AI analizuje Twoje materiały i układa pytania...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Twoje Quizy</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setLengthModalVisible(true)}>
          <Plus color="white" size={20} />
          <Text style={styles.addButtonText}>Nowy Quiz</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={quizzes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.quizCard}
            onPress={() => setSelectedQuizId(item.id)}
          >
            <View style={styles.quizInfo}>
              <Text style={styles.quizTitle}>{item.title}</Text>
              <View style={styles.quizMeta}>
                <View style={styles.metaItem}>
                  <Clock size={12} color="#94a3b8" />
                  <Text style={styles.metaText}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.metaItem}>
                  <BarChart3 size={12} color="#94a3b8" />
                  <Text style={styles.metaText}>Pytania: {item.total_questions}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.quizResult}>
              <Text style={[styles.scoreText, { color: item.score > 0 ? '#10b981' : '#94a3b8' }]}>
                {item.score}/{item.total_questions}
              </Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FileQuestion color="#334155" size={64} strokeWidth={1} />
            <Text style={styles.emptyTitle}>Brak quizów</Text>
            <Text style={styles.emptySubtitle}>Wygeneruj swój pierwszy test wiedzy!</Text>
          </View>
        }
      />

      <Modal
        visible={lengthModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLengthModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wybierz długość quizu</Text>
            
            <LengthOption 
              title="Krótki" 
              subtitle="5 pytań • Szybka powtórka" 
              onPress={() => handleCreateQuiz(5)} 
            />
            <LengthOption 
              title="Średni" 
              subtitle="10 pytań • Solidny test" 
              onPress={() => handleCreateQuiz(10)} 
            />
            <LengthOption 
              title="Długi" 
              subtitle="20 pytań • Pełny egzamin" 
              onPress={() => handleCreateQuiz(20)} 
            />

            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setLengthModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Anuluj</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const LengthOption = ({ title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.lengthOption} onPress={onPress}>
    <View>
      <Text style={styles.optionTitle}>{title}</Text>
      <Text style={styles.optionSubtitle}>{subtitle}</Text>
    </View>
    <ChevronRight color="#4f46e5" size={20} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  addButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  quizCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quizInfo: { flex: 1 },
  quizTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  quizMeta: { flexDirection: 'row', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#94a3b8', fontSize: 11 },
  quizResult: { alignItems: 'flex-end', gap: 10 },
  scoreText: { fontWeight: 'bold', fontSize: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { color: '#94a3b8', marginTop: 20, textAlign: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySubtitle: { color: '#94a3b8', fontSize: 14, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  lengthOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 20,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  optionTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  optionSubtitle: { color: '#94a3b8', fontSize: 12 },
  cancelButton: { marginTop: 10, paddingVertical: 12 },
  cancelButtonText: { color: '#ef4444', textAlign: 'center', fontWeight: 'bold' },
});

export default QuizView;
