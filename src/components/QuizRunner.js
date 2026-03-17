import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useStore } from '../store/useStore';
import { CheckCircle2, XCircle, ChevronRight, Share2, Download, Home, FileText } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const QuizRunner = ({ quizId, onFinish }) => {
  const { getQuizQuestions, saveQuizResult, quizzes } = useStore();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  const quizMetadata = quizzes.find(q => q.id === quizId);

  useEffect(() => {
    const loadQuestions = async () => {
      const q = await getQuizQuestions(quizId);
      setQuestions(q);
      setLoading(false);
    };
    loadQuestions();
  }, [quizId]);

  const handleSelectAnswer = (answer) => {
    if (isFinished) return;
    
    const currentQ = questions[currentIndex];
    const isMultichoice = currentQ.correct_answer.includes(',');
    
    if (isMultichoice) {
      const currentSelection = selectedAnswers[currentQ.id] ? selectedAnswers[currentQ.id].split(', ') : [];
      let newSelection;
      
      if (currentSelection.includes(answer)) {
        newSelection = currentSelection.filter(a => a !== answer);
      } else {
        newSelection = [...currentSelection, answer];
      }
      
      setSelectedAnswers({
        ...selectedAnswers,
        [currentQ.id]: newSelection.sort().join(', ')
      });
    } else {
      setSelectedAnswers({
        ...selectedAnswers,
        [questions[currentIndex].id]: answer
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    let score = 0;
    questions.forEach(q => {
      const isMultichoice = q.correct_answer.includes(',');
      const userAns = selectedAnswers[q.id] || '';
      
      if (isMultichoice) {
        // Sort both to ensure comparison works regardless of selection order
        const sortedUser = userAns.split(', ').sort().join(', ');
        const sortedCorrect = q.correct_answer.split(', ').sort().join(', ');
        if (sortedUser === sortedCorrect && sortedUser !== '') {
          score++;
        }
      } else {
        if (userAns === q.correct_answer) {
          score++;
        }
      }
    });

    await saveQuizResult(quizId, score, selectedAnswers);
    setIsFinished(true);
  };

  const exportToPDF = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #1e293b; }
            h1 { color: #4f46e5; text-align: center; }
            .meta { text-align: center; color: #64748b; margin-bottom: 40px; }
            .question { margin-bottom: 30px; padding: 20px; border-bottom: 1px solid #e2e8f0; }
            .q-text { font-weight: bold; margin-bottom: 10px; font-size: 18px; }
            .option { margin-left: 20px; margin-bottom: 5px; color: #475569; }
            .correct { color: #10b981; font-weight: bold; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>${quizMetadata?.title || 'Quiz Edukacyjny'}</h1>
          <div class="meta">Wygenerowano przez wykuj.ai • Data: ${new Date().toLocaleDateString('pl-PL')}</div>
          ${questions.map((q, i) => `
            <div class="question">
              <div class="q-text">${i + 1}. ${q.question}</div>
              ${q.options.map(opt => `<div class="option">○ ${opt}</div>`).join('')}
              <div class="correct">Poprawna odpowiedź: ${q.correct_answer}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się wygenerować pliku PDF.');
    }
  };

  const exportToMarkdown = async () => {
    let md = `# ${quizMetadata?.title || 'Quiz Edukacyjny'}\n\n`;
    md += `Data: ${new Date().toLocaleDateString('pl-PL')}\n\n`;
    
    questions.forEach((q, i) => {
      md += `### ${i + 1}. ${q.question}\n`;
      q.options.forEach(opt => {
        md += `- [ ] ${opt}\n`;
      });
      md += `\n**Poprawna odpowiedź:** ${q.correct_answer}\n\n---\n\n`;
    });

    try {
      const { uri } = await Print.printToFileAsync({ html: `<pre>${md}</pre>` }); // Simple way to share text via share sheet
      await Sharing.shareAsync(uri, { UTI: '.txt', mimeType: 'text/plain' });
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się wyeksportować pliku.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (isFinished) {
    const score = questions.reduce((acc, q) => acc + (selectedAnswers[q.id] === q.correct_answer ? 1 : 0), 0);
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <ScrollView contentContainerStyle={styles.resultContainer}>
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Koniec Quizu!</Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreNumber}>{score}</Text>
            <Text style={styles.scoreTotal}>/ {questions.length}</Text>
          </View>
          <Text style={styles.percentageText}>{percentage}% poprawnych odpowiedzi</Text>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={exportToPDF}>
            <Download color="#4f46e5" size={24} />
            <Text style={styles.actionLabel}>Drukuj PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={exportToMarkdown}>
            <Share2 color="#10b981" size={24} />
            <Text style={styles.actionLabel}>Udostępnij</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.finishBtn} onPress={onFinish}>
          <Home color="white" size={20} />
          <Text style={styles.finishBtnText}>Wróć do menu</Text>
        </TouchableOpacity>

        <View style={styles.reviewHeader}>
          <Text style={styles.reviewTitle}>Przegląd odpowiedzi</Text>
        </View>

        {questions.map((q, idx) => {
          const isCorrect = selectedAnswers[q.id] === q.correct_answer;
          return (
            <View key={q.id} style={styles.reviewCard}>
              <Text style={styles.reviewQuestion}>{idx + 1}. {q.question}</Text>
              <View style={styles.answerRow}>
                <Text style={styles.answerLabel}>Twoja:</Text>
                <Text style={[styles.answerValue, { color: isCorrect ? '#10b981' : '#ef4444' }]}>
                  {selectedAnswers[q.id] || '(brak)'}
                </Text>
              </View>
              {!isCorrect && (
                <View style={styles.answerRow}>
                  <Text style={styles.answerLabel}>Poprawna:</Text>
                  <Text style={[styles.answerValue, { color: '#10b981' }]}>{q.correct_answer}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.qCount}>Pytanie {currentIndex + 1} z {questions.length}</Text>
        {questions[currentIndex]?.correct_answer?.includes(',') && (
          <View style={styles.multiBadge}>
            <Text style={styles.multiBadgeText}>WIELOKROTNY WYBÓR</Text>
          </View>
        )}
      </View>
      
      <ScrollView style={styles.scrollContent}>
        <Text style={styles.questionText}>{currentQ.question}</Text>

        <View style={styles.optionsContainer}>
          {currentQ.options.map((option, idx) => {
            const isMultichoice = currentQ.correct_answer.includes(',');
            const currentSelection = selectedAnswers[currentQ.id] ? selectedAnswers[currentQ.id].split(', ') : [];
            const isSelected = isMultichoice ? currentSelection.includes(option) : selectedAnswers[currentQ.id] === option;
            
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionSelected
                ]}
                onPress={() => handleSelectAnswer(option)}
              >
                <View style={[
                  isMultichoice ? styles.checkbox : styles.radio, 
                  isSelected && (isMultichoice ? styles.checkboxSelected : styles.radioSelected)
                ]}>
                  {isSelected && (isMultichoice ? <CheckCircle2 size={14} color="white" /> : <View style={styles.radioInner} />)}
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.nextBtn, !selectedAnswers[currentQ.id] && styles.disabledBtn]}
        disabled={!selectedAnswers[currentQ.id]}
        onPress={handleNext}
      >
        <Text style={styles.nextBtnText}>
          {currentIndex === questions.length - 1 ? 'Zakończ Quiz' : 'Następne pytanie'}
        </Text>
        <ChevronRight color="white" size={20} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  progressBar: { height: 6, backgroundColor: '#334155', borderRadius: 3, marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: '#4f46e5', borderRadius: 3 },
  qCount: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold', marginBottom: 20 },
  scrollContent: { flex: 1 },
  questionText: { color: 'white', fontSize: 22, fontWeight: 'bold', lineHeight: 32, marginBottom: 40 },
  optionsContainer: { gap: 12 },
  optionButton: {
    backgroundColor: '#1e293b',
    padding: 18,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14,
  },
  optionSelected: { borderColor: '#4f46e5', backgroundColor: '#4f46e510' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#475569', justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: '#4f46e5' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4f46e5' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#475569', justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { borderColor: '#10b981', backgroundColor: '#10b981' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  multiBadge: { backgroundColor: '#10b98120', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#10b98140' },
  multiBadgeText: { color: '#10b981', fontSize: 10, fontWeight: 'bold' },
  optionText: { color: '#cbd5e1', fontSize: 16 },
  optionTextSelected: { color: 'white', fontWeight: 'bold' },
  nextBtn: {
    backgroundColor: '#4f46e5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    marginTop: 20,
    gap: 8,
  },
  disabledBtn: { opacity: 0.5 },
  nextBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  resultContainer: { paddingBottom: 40 },
  resultCard: { backgroundColor: '#1e293b', padding: 30, borderRadius: 32, alignItems: 'center', marginBottom: 20 },
  resultTitle: { color: '#94a3b8', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  scoreBadge: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  scoreNumber: { color: '#10b981', fontSize: 64, fontWeight: 'bold' },
  scoreTotal: { color: '#475569', fontSize: 24, fontWeight: 'bold', marginLeft: 6 },
  percentageText: { color: '#94a3b8', fontSize: 14 },
  actionGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionButton: { flex: 1, backgroundColor: '#1e293b', padding: 20, borderRadius: 24, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#334155' },
  actionLabel: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  finishBtn: { backgroundColor: '#4f46e5', flexDirection: 'row', padding: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 40 },
  finishBtnText: { color: 'white', fontWeight: 'bold' },
  reviewHeader: { marginBottom: 16 },
  reviewTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  reviewCard: { backgroundColor: '#0f172a', padding: 20, borderRadius: 24, marginBottom: 12, borderWidth: 1, borderColor: '#1e293b' },
  reviewQuestion: { color: 'white', fontSize: 15, fontWeight: '600', marginBottom: 12, lineHeight: 22 },
  answerRow: { flexDirection: 'row', marginBottom: 4 },
  answerLabel: { color: '#94a3b8', width: 75, fontSize: 13 },
  answerValue: { flex: 1, fontSize: 13, fontWeight: 'bold' },
});

export default QuizRunner;
