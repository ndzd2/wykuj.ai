import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useStore } from '../store/useStore';
import { aiService } from '../services/aiService';
import { FileDown, FileText, Sparkles, Info } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const NotesComponent = () => {
  const { materials } = useStore();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const generateNotes = async (length) => {
    if (materials.length === 0) {
      Alert.alert('Brak materiałów', 'Dodaj najpierw materiały w zakładce Materiały, aby wygenerować notatki.');
      return;
    }

    setLoading(true);
    try {
      const context = materials.map(m => `Plik: ${m.name}\nTreść: ${m.content}`).join('\n\n');
      const generatedNotes = await aiService.generateNotes(context, length);
      setNotes(generatedNotes);
    } catch (error) {
      console.error(error);
      Alert.alert('Błąd', 'Nie udało się wygenerować notatek.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (!notes) return;

    const filename = `Notatki_WykujAI_${Date.now()}.${format}`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    try {
      await FileSystem.writeAsStringAsync(fileUri, notes, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Eksport gotowy', `Plik zapisany w: ${fileUri}`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Błąd eksportu', 'Nie udało się zapisać pliku.');
    }
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="bg-slate-800/50 p-4 rounded-2xl mb-6 mt-4 border border-slate-700 flex-row items-start">
        <Info color="#6366f1" size={16} style={{ marginTop: 2, marginRight: 8 }} />
        <Text className="text-slate-400 text-xs flex-1 leading-5">
          Tutaj możesz wygenerować automatyczne opracowania Twoich materiałów. Wybierz długość i pozwól AI przygotować "ściągę".
        </Text>
      </View>

      <Text className="text-white text-lg font-bold mb-4">Wybierz format notatek:</Text>
      
      <View className="flex-row gap-2 mb-6">
        <LengthButton label="Krótkie" onPress={() => generateNotes('krótkie')} />
        <LengthButton label="Średnie" onPress={() => generateNotes('średnie')} />
        <LengthButton label="Długie" onPress={() => generateNotes('długie')} />
      </View>

      {loading ? (
        <View className="items-center mt-10 p-10 bg-slate-800 rounded-3xl border border-slate-700">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-slate-400 mt-4 font-medium">AI przygotowuje notatki...</Text>
        </View>
      ) : notes ? (
        <View>
          <View className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-6">
            <Text className="text-white leading-relaxed text-[15px]">{notes}</Text>
          </View>

          <Text className="text-slate-400 mb-4 font-semibold text-xs uppercase tracking-widest">Eksportuj do pliku:</Text>
          <View className="flex-row gap-4 mb-10">
            <TouchableOpacity 
              className="flex-1 bg-indigo-600/20 border border-indigo-500/30 p-4 rounded-2xl flex-row justify-center items-center"
              onPress={() => handleExport('md')}
            >
              <FileDown color="#c7d2fe" size={20} />
              <Text className="text-indigo-200 font-bold ml-2">.md (Markdown)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-1 bg-slate-700 p-4 rounded-2xl flex-row justify-center items-center"
              onPress={() => handleExport('txt')}
            >
              <FileText color="white" size={20} />
              <Text className="text-white font-bold ml-2">.txt (Tekst)</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="items-center mt-10 bg-slate-800/30 p-10 rounded-3xl border border-slate-800 border-dashed">
          <Sparkles color="#334155" size={48} />
          <Text className="text-slate-500 text-center mt-4">
            Kliknij powyżej, aby stworzyć notatki na podstawie załączonych materiałów.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const LengthButton = ({ label, onPress }) => (
  <TouchableOpacity 
    className="flex-1 bg-indigo-600 p-4 rounded-2xl items-center shadow-lg shadow-indigo-500/20"
    onPress={onPress}
  >
    <Text className="text-white font-bold">{label}</Text>
  </TouchableOpacity>
);

export default NotesComponent;
