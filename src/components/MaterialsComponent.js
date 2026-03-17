import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useStore } from '../store/useStore';
import * as DocumentPicker from 'expo-document-picker';
import { extractText } from 'expo-pdf-text-extract';
import * as FileSystem from 'expo-file-system';
import * as mammoth from 'mammoth/mammoth.browser';
import * as XLSX from 'xlsx';
import { Buffer } from 'buffer';
import { parsePptx } from 'pptx-parser';
import * as ImagePicker from 'expo-image-picker';
import { aiService } from '../services/aiService';
import { Mic, Camera, Image as ImageIcon, Music, FileText, Plus, X, UploadCloud, Info, Trash2, Edit3, Search } from 'lucide-react-native';
import { useAudioRecorder, requestRecordingPermissionsAsync, getRecordingPermissionsAsync, setAudioModeAsync, RecordingPresets } from 'expo-audio';

const MaterialsComponent = () => {
  const { materials, currentProject, addMaterial, updateMaterial, deleteMaterial, searchQuery, setSearchQuery } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [recording, setRecording] = useState(null); // Keep for legacy cleanup if needed, but we use recorder hook now
  const [isRecording, setIsRecording] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  React.useEffect(() => {
    return () => {
      // Cleanup handled by hook mostly, but safe to stop if still active
    };
  }, []);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        setFileName(file.name);
        const fileUri = file.uri;
        const mimeType = file.mimeType || '';
        const extension = file.name.split('.').pop().toLowerCase();

        setIsExtracting(true);
        try {
          if (mimeType === 'application/pdf' || extension === 'pdf') {
            const text = await extractText(fileUri);
            if (text) setFileContent(text);
            else Alert.alert('Uwaga', 'Nie udało się wyciągnąć tekstu z tego pliku PDF.');
          }
          else if (mimeType === 'text/plain' || extension === 'txt') {
            const text = await FileSystem.readAsStringAsync(fileUri);
            setFileContent(text);
          }
          else if (['docx', 'pptx', 'xlsx', 'odt', 'odp', 'ods'].includes(extension)) {
            const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
            const arrayBuffer = Buffer.from(base64, 'base64').buffer;

            if (extension === 'docx') {
              const result = await mammoth.convertToRawText({ arrayBuffer });
              setFileContent(result.value);
            }
            else if (extension === 'xlsx' || extension === 'ods') {
              const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
              let allText = '';
              workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                allText += `--- Arkusz: ${sheetName} ---\n`;
                allText += XLSX.utils.sheet_to_txt(sheet) + '\n\n';
              });
              setFileContent(allText);
            }
            else if (extension === 'pptx') {
              try {
                const result = await parsePptx(arrayBuffer);
                let allText = '';
                result.slides.forEach((slide, index) => {
                  allText += `--- Slajd ${index + 1} ---\n`;
                  slide.elements.forEach(el => {
                    if (el.type === 'text' && el.text) {
                      allText += el.text + '\n';
                    }
                  });
                  allText += '\n';
                });
                setFileContent(allText);
              } catch (err) {
                console.error('PPTX Error:', err);
                Alert.alert('Błąd', 'Nie udało się przetworzyć prezentacji PPTX.');
              }
            }
            else {
              Alert.alert('W trakcie wdrażania', `Obsługa formatu .${extension} jest jeszcze w fazie testów. Spróbuj PDF lub Word .docx`);
            }
          }
          else {
            Alert.alert('Format nieobsługiwany', 'Ten format pliku nie jest jeszcze obsługiwany do automatycznej ekstrakcji.');
          }
        } catch (err) {
          console.error('Extraction Error:', err);
          Alert.alert('Błąd', 'Wystąpił problem podczas czytania pliku.');
        } finally {
          setIsExtracting(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        setFileName(`Transkrypcja: ${file.name}`);
        setIsExtracting(true);
        try {
          const text = await aiService.transcribeAudio(file.uri, file.name, file.mimeType);
          setFileContent(text);
        } catch (err) {
          Alert.alert('Błąd', err.message);
        } finally {
          setIsExtracting(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOCR = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Błąd', 'Brak dostępu do aparatu.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          base64: true,
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Błąd', 'Brak dostępu do galerii.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          base64: true,
          quality: 0.8,
        });
      }

      if (!result.canceled) {
        const asset = result.assets[0];
        setFileName(`Skan: ${new Date().toLocaleTimeString()}`);
        setIsExtracting(true);
        try {
          const text = await aiService.extractTextFromImage(asset.base64);
          setFileContent(text);
        } catch (err) {
          Alert.alert('Błąd', err.message);
        } finally {
          setIsExtracting(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartRecording = async () => {
    try {
      // Set audio mode for recording
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Check current permission
      let permission = await getRecordingPermissionsAsync();
      
      if (permission.status !== 'granted') {
        permission = await requestRecordingPermissionsAsync();
      }

      if (!permission.granted) {
        Alert.alert('Błąd', 'Brak dostępu do mikrofonu.');
        return;
      }

      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Błąd', 'Nie udało się rozpocząć nagrywania.');
    }
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      
      setFileName(`Nagranie: ${new Date().toLocaleTimeString()}`);
      setIsExtracting(true);
      try {
        const text = await aiService.transcribeAudio(uri, 'recording.m4a', 'audio/m4a');
        setFileContent(text);
      } catch (err) {
        Alert.alert('Błąd', err.message);
      } finally {
        setIsExtracting(false);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const handleSaveMaterial = async () => {
    if (isExtracting) {
      Alert.alert('Proszę czekać', 'Trwa wyciąganie tekstu z pliku...');
      return;
    }

    if (!currentProject?.id) {
      Alert.alert('Błąd', 'Brak aktywnego projektu. Spróbuj wejść do projektu ponownie.');
      return;
    }

    if (!fileName.trim()) {
      Alert.alert('Błąd', 'Proszę podać nazwę materiału.');
      return;
    }

    if (!fileContent.trim()) {
      Alert.alert('Błąd', 'Materiały muszą zawierać treść. Wybierz plik lub wpisz tekst ręcznie.');
      return;
    }

    try {
      if (editingId) {
        await updateMaterial(editingId, fileName, fileContent);
      } else {
        await addMaterial(currentProject.id, fileName, fileContent, 'text');
      }
      closeModal();
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zapisać materiału.');
    }
  };

  const openModal = (material = null) => {
    if (material) {
      setEditingId(material.id);
      setFileName(material.name);
      setFileContent(material.content);
    } else {
      setEditingId(null);
      setFileName('');
      setFileContent('');
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setFileName('');
    setFileContent('');
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Usuń materiał',
      'Czy na pewno chcesz usunąć ten materiał?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Usuń', style: 'destructive', onPress: () => deleteMaterial(id) }
      ]
    );
  };

  const renderMaterialItem = ({ item }) => (
    <View className="bg-slate-800/80 p-4 rounded-3xl mb-4 border border-slate-700/50 flex-row items-center shadow-lg shadow-black/20">
      <View className="bg-indigo-500/10 p-4 rounded-2xl mr-4 border border-indigo-500/10">
        <FileText color="#818cf8" size={22} />
      </View>
      <View className="flex-1">
        <Text className="text-white font-bold text-base" numberOfLines={1}>{item.name}</Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter">Text</Text>
          <View className="w-1 h-1 bg-slate-700 rounded-full mx-2" />
          <Text className="text-slate-500 text-[10px]">{item.content.length} znaków</Text>
        </View>
      </View>
      <View className="flex-row">
        <TouchableOpacity
          className="p-2.5 ml-2 bg-slate-700/30 rounded-xl border border-slate-600/30"
          onPress={() => openModal(item)}
        >
          <Edit3 color="#94a3b8" size={16} />
        </TouchableOpacity>
        <TouchableOpacity
          className="p-2.5 ml-2 bg-red-500/5 rounded-xl border border-red-500/10"
          onPress={() => handleDelete(item.id)}
        >
          <Trash2 color="#f87171" size={16} opacity={0.8} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      <View className="bg-slate-800/50 p-4 rounded-2xl mb-6 border border-slate-700 flex-row items-start">
        <Info color="#6366f1" size={16} style={{ marginTop: 2, marginRight: 8 }} />
        <Text className="text-slate-400 text-xs flex-1 leading-5">
          Dodaj materiały (PDF, Office, TXT), aby AI mogło się z nich uczyć. Treść zostanie wyciągnięta automatycznie.
        </Text>
      </View>

      <TouchableOpacity
        className="bg-indigo-600 p-4 rounded-2xl mb-4 flex-row justify-center items-center shadow-lg shadow-indigo-500/20"
        onPress={() => openModal()}
      >
        <Plus color="white" size={20} />
        <Text className="text-white font-bold ml-2 text-base">Dodaj nowy materiał</Text>
      </TouchableOpacity>

      {/* Search Bar */}
      <View className="flex-row items-center bg-slate-800/80 px-4 py-3 rounded-2xl mb-6 border border-slate-700">
        <Search size={18} color="#64748b" className="mr-3" />
        <TextInput 
          className="flex-1 text-white text-sm"
          placeholder="Szukaj w materiałach..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={materials.filter(m => 
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          m.content.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        renderItem={renderMaterialItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={
          <View className="items-center mt-10">
            <UploadCloud color="#334155" size={48} />
            <Text className="text-slate-500 mt-4 text-center">Brak załączonych materiałów.{"\n"}Dodaj coś, aby zacząć naukę!</Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/60"
        >
          <View className="bg-slate-900 p-6 rounded-t-[40px] border-t border-slate-700 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-white text-2xl font-bold">
                  {editingId ? 'Edytuj Materiał' : 'Nowy Materiał'}
                </Text>
                <Text className="text-slate-400 text-xs mt-1">AI pomoże Ci wyciągnąć naukę z treści</Text>
              </View>
              <TouchableOpacity
                onPress={closeModal}
                className="bg-slate-800 p-2 rounded-full"
              >
                <X color="#94a3b8" size={20} />
              </TouchableOpacity>
            </View>

            <Text className="text-slate-400 mb-3 ml-1 text-[10px] uppercase tracking-[2px] font-bold">Wybierz źródło treści</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="flex-row mb-6 py-2"
              contentContainerStyle={{ paddingRight: 20 }}
            >
              <TouchableOpacity
                className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 items-center justify-center mr-3 w-28 h-24"
                onPress={handlePickDocument}
              >
                <View className="bg-indigo-500/10 p-2 rounded-xl mb-2">
                  <UploadCloud color="#6366f1" size={20} />
                </View>
                <Text className="text-slate-300 text-[10px] font-bold text-center">DOKUMENT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 items-center justify-center mr-3 w-28 h-24"
                onPress={() => handleOCR(false)}
              >
                <View className="bg-emerald-500/10 p-2 rounded-xl mb-2">
                  <ImageIcon color="#10b981" size={20} />
                </View>
                <Text className="text-slate-300 text-[10px] font-bold text-center">GALERIA (OCR)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 items-center justify-center mr-3 w-28 h-24"
                onPress={() => handleOCR(true)}
              >
                <View className="bg-amber-500/10 p-2 rounded-xl mb-2">
                  <Camera color="#f59e0b" size={20} />
                </View>
                <Text className="text-slate-300 text-[10px] font-bold text-center">APARAT (OCR)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 items-center justify-center mr-3 w-28 h-24"
                onPress={handlePickAudio}
              >
                <View className="bg-pink-500/10 p-2 rounded-xl mb-2">
                  <Music color="#ec4899" size={20} />
                </View>
                <Text className="text-slate-300 text-[10px] font-bold text-center">AUDIO</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`p-4 rounded-2xl border items-center justify-center w-28 h-24 ${isRecording ? 'bg-red-500/10 border-red-500/50' : 'bg-slate-800/50 border-slate-700'}`}
                onPress={isRecording ? handleStopRecording : handleStartRecording}
              >
                <View className={`${isRecording ? 'bg-red-500/20' : 'bg-indigo-500/10'} p-2 rounded-xl mb-2`}>
                  <Mic color={isRecording ? "#ef4444" : "#6366f1"} size={20} />
                </View>
                <Text className={`${isRecording ? 'text-red-400' : 'text-slate-300'} text-[10px] font-bold text-center`}>
                  {isRecording ? 'STOP' : 'NAGRAJ'}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <ScrollView className="mb-4 pr-1">
              {isExtracting && (
                <View className="mb-6 p-4 bg-indigo-500/10 rounded-2xl flex-row items-center border border-indigo-500/20">
                  <ActivityIndicator color="#6366f1" size="small" />
                  <Text className="text-indigo-400 ml-3 font-semibold text-xs">AI analizuje materiał...</Text>
                </View>
              )}

              <View className="mb-5">
                <Text className="text-slate-500 mb-2 ml-1 text-[10px] uppercase tracking-widest font-bold">Nazwa materiału</Text>
                <TextInput
                  className="bg-slate-800/50 text-white p-4 rounded-2xl border border-slate-700 text-base"
                  placeholder="np. Notatki z biologii"
                  placeholderTextColor="#475569"
                  value={fileName}
                  onChangeText={setFileName}
                />
              </View>

              <View className="mb-6">
                <Text className="text-slate-500 mb-2 ml-1 text-[10px] uppercase tracking-widest font-bold">Treść notatki</Text>
                <TextInput
                  className="bg-slate-800/50 text-white p-4 rounded-2xl border border-slate-700 h-48 text-base"
                  placeholder="Wpisz tekst lub skorzystaj z opcji powyżej..."
                  placeholderTextColor="#475569"
                  value={fileContent}
                  onChangeText={setFileContent}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              className="bg-indigo-600 p-5 rounded-[22px] items-center shadow-xl shadow-indigo-500/40"
              onPress={handleSaveMaterial}
            >
              <Text className="text-white font-bold text-lg tracking-wide">
                {editingId ? 'Zapisz zmiany' : 'Dodaj do projektu'}
              </Text>
            </TouchableOpacity>

            <View className="mb-6" />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default MaterialsComponent;
