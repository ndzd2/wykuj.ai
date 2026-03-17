import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { Brain, FileText, Mic, Sparkles, ChevronRight, Check } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Witaj w Wykuj.AI',
    description: 'Twoja nauka wkracza na wyższy poziom. Analizuj, twórz i zapamiętuj szybciej niż kiedykolwiek.',
    icon: <Brain size={80} color="#6366f1" />,
    color: '#6366f1',
  },
  {
    id: '2',
    title: 'Inteligentne Materiały',
    description: 'Wgrywaj PDF-y, zdjęcia notatek lub rób zdjęcia podręcznika. AI wyciągnie z nich samą esencję.',
    icon: <FileText size={80} color="#10b981" />,
    color: '#10b981',
  },
  {
    id: '3',
    title: 'Ucz się Słuchem',
    description: 'Nagrywaj wykłady lub czytaj na głos. Nasza transkrypcja zamieni mowę w gotowe notatki.',
    icon: <Mic size={80} color="#f59e0b" />,
    color: '#f59e0b',
  },
  {
    id: '4',
    title: 'Planer i Quizy AI',
    description: 'Generuj spersonalizowane mapy drogowe nauki i quizy, które dopasują się do Twojego poziomu.',
    icon: <Sparkles size={80} color="#ec4899" />,
    color: '#ec4899',
  },
];

const OnboardingScreen = () => {
  const { completeOnboarding } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };

  const skip = () => {
    completeOnboarding();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <TouchableOpacity onPress={skip}>
          <Text style={styles.skipText}>Pomiń</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={SLIDES}
        renderItem={({ item }) => <Slide item={item} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />

      <View style={styles.footer}>
        <Paginator data={SLIDES} scrollX={scrollX} />
        <TouchableOpacity 
          style={[styles.nextButton, { backgroundColor: SLIDES[currentIndex].color }]} 
          onPress={scrollToNext}
        >
          {currentIndex === SLIDES.length - 1 ? (
            <Check color="white" size={24} />
          ) : (
            <ChevronRight color="white" size={24} />
          )}
          <Text style={styles.nextButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Zaczynamy!' : 'Dalej'}
          </Text>
        </TouchableOpacity>
        
        {currentIndex === SLIDES.length - 1 && (
          <Text style={styles.restartHint}>
            Pamiętaj, że zawsze możesz wrócić do tego samouczka z menu bocznego (opcja "Zapoznaj się").
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const Slide = ({ item }) => (
  <View style={[styles.slide, { width }]}>
    <View style={styles.iconContainer}>{item.icon}</View>
    <View style={styles.textContainer}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  </View>
);

const Paginator = ({ data, scrollX }) => {
  return (
    <View style={styles.paginatorContainer}>
      {data.map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [10, 20, 10],
          extrapolate: 'clamp',
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });
        return <Animated.View style={[styles.dot, { width: dotWidth, opacity }]} key={i.toString()} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  topSection: { 
    height: 40, 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    paddingHorizontal: 20,
    marginTop: 10
  },
  skipText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  iconContainer: { marginBottom: 40 },
  textContainer: { alignItems: 'center' },
  title: { color: 'white', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 15 },
  description: { color: '#94a3b8', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  footer: { paddingHorizontal: 40, paddingBottom: 60, alignItems: 'center' },
  paginatorContainer: { flexDirection: 'row', height: 64 },
  dot: { height: 10, borderRadius: 5, backgroundColor: '#6366f1', marginHorizontal: 8 },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    marginTop: 20,
  },
  nextButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  restartHint: { color: '#475569', fontSize: 11, textAlign: 'center', marginTop: 24, lineHeight: 16 },
});

export default OnboardingScreen;
