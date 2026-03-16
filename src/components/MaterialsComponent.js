import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useStore } from '../store/useStore';
import { FileText, Plus, X, UploadCloud, Info, Trash2, Edit3 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { extractText } from 'expo-pdf-text-extract';
import * as FileSystem from 'expo-file-system/legacy';
import * as mammoth from 'mammoth/mammoth.browser';
import * as XLSX from 'xlsx';
import { Buffer } from 'buffer';
import { parsePptx } from 'pptx-parser';

const MaterialsComponent = () => {
  const { materials, currentProject, addMaterial, updateMaterial, deleteMaterial } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

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
                // pptx-parser usually takes a buffer or ArrayBuffer
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

  const handleSaveMaterial = () => {
    if (fileName.trim() && fileContent.trim()) {
      if (editingId) {
        updateMaterial(editingId, fileName, fileContent);
      } else {
        addMaterial(currentProject.id, fileName, fileContent, 'text');
      }
      closeModal();
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
    <View className="bg-slate-800 p-4 rounded-2xl mb-3 border border-slate-700 flex-row items-center">
      <View className="bg-indigo-500/10 p-3 rounded-xl mr-4">
        <FileText color="#6366f1" size={24} />
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold text-base" numberOfLines={1}>{item.name}</Text>
        <Text className="text-slate-500 text-xs mt-0.5">Materiały tekstowe • {item.content.length} znaków</Text>
      </View>
      <View className="flex-row">
        <TouchableOpacity
          className="p-2 ml-2 bg-slate-700/50 rounded-lg"
          onPress={() => openModal(item)}
        >
          <Edit3 color="#94a3b8" size={16} />
        </TouchableOpacity>
        <TouchableOpacity
          className="p-2 ml-2 bg-red-500/10 rounded-lg"
          onPress={() => handleDelete(item.id)}
        >
          <Trash2 color="#ef4444" size={16} />
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
        className="bg-indigo-600 p-4 rounded-2xl mb-6 flex-row justify-center items-center shadow-lg shadow-indigo-500/20"
        onPress={() => openModal()}
      >
        <Plus color="white" size={20} />
        <Text className="text-white font-bold ml-2 text-base">Dodaj nowy materiał</Text>
      </TouchableOpacity>

      <FlatList
        data={materials}
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
          <View className="bg-slate-900 p-8 rounded-t-[40px] border-t border-slate-700">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-2xl font-bold">
                {editingId ? 'Edytuj Materiał' : 'Nowy Materiał'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X color="#94a3b8" size={24} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="bg-slate-800 p-4 rounded-xl mb-4 border border-slate-700 items-center flex-row justify-center"
              onPress={handlePickDocument}
            >
              {isExtracting ? (
                <ActivityIndicator color="#6366f1" size="small" />
              ) : (
                <UploadCloud color="#6366f1" size={20} />
              )}
              <Text className="text-slate-300 ml-2 font-medium">
                {isExtracting ? 'Czytam plik...' : 'Wybierz plik (PDF/DOCX/TXT...)'}
              </Text>
            </TouchableOpacity>

            <Text className="text-slate-400 mb-2 ml-1 text-xs uppercase tracking-widest font-bold">Nazwa</Text>
            <TextInput
              className="bg-slate-800 text-white p-4 rounded-xl mb-4 border border-slate-700"
              placeholder="np. Notatki z wykładu"
              placeholderTextColor="#64748b"
              value={fileName}
              onChangeText={setFileName}
            />

            <Text className="text-slate-400 mb-2 ml-1 text-xs uppercase tracking-widest font-bold">Treść</Text>
            <TextInput
              className="bg-slate-800 text-white p-4 rounded-xl mb-6 border border-slate-700 h-40"
              placeholder="Tutaj pojawi się wyciągnięty tekst..."
              placeholderTextColor="#64748b"
              value={fileContent}
              onChangeText={setFileContent}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              className="bg-indigo-600 p-5 rounded-2xl items-center shadow-lg shadow-indigo-500/30"
              onPress={handleSaveMaterial}
            >
              <Text className="text-white font-bold text-lg">
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
