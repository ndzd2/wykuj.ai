import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { Plus, BookOpen } from 'lucide-react-native';

const HomeScreen = ({ navigation }) => {
  const { projects, addProject } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  const handleCreateProject = () => {
    if (projectName.trim()) {
      addProject(projectName, projectDesc);
      setProjectName('');
      setProjectDesc('');
      setModalVisible(false);
    }
  };

  const renderProjectItem = ({ item }) => (
    <TouchableOpacity 
      className="bg-slate-800 p-6 rounded-2xl mb-4 border border-slate-700 flex-row justify-between items-center"
      onPress={() => navigation.navigate('ProjectDetail', { project: item })}
    >
      <View className="flex-1">
        <Text className="text-white text-xl font-bold mb-1">{item.name}</Text>
        <Text className="text-slate-400 text-sm" numberOfLines={1}>{item.description || 'Brak opisu'}</Text>
      </View>
      <BookOpen color="#6366f1" size={24} trace={"1.5"} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-900 px-4" edges={['bottom', 'left', 'right']}>
      <View className="flex-row justify-between items-center mb-6 mt-4">
        <Text className="text-white text-3xl font-black">Moje Projekty</Text>
        <TouchableOpacity 
          className="bg-indigo-600 p-3 rounded-full shadow-lg shadow-indigo-500/50"
          onPress={() => setModalVisible(true)}
        >
          <Plus color="white" size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={projects}
        renderItem={renderProjectItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Text className="text-slate-500 text-lg">Nie masz jeszcze żadnych projektów.</Text>
            <Text className="text-indigo-400 mt-2">Stwórz pierwszy projekt, aby zacząć!</Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/60"
        >
          <View className="bg-slate-900 p-8 rounded-t-[40px] border-t border-slate-700">
            <Text className="text-white text-2xl font-bold mb-6">Nowy Projekt</Text>
            
            <Text className="text-slate-400 mb-2 ml-1">Nazwa</Text>
            <TextInput
              className="bg-slate-800 text-white p-4 rounded-xl mb-4 border border-slate-700"
              placeholder="np. Egzamin z Biologii"
              placeholderTextColor="#64748b"
              value={projectName}
              onChangeText={setProjectName}
            />

            <Text className="text-slate-400 mb-2 ml-1">Opis (opcjonalnie)</Text>
            <TextInput
              className="bg-slate-800 text-white p-4 rounded-xl mb-8 border border-slate-700 h-24"
              placeholder="O czym jest ten projekt?"
              placeholderTextColor="#64748b"
              value={projectDesc}
              onChangeText={setProjectDesc}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity 
              className="bg-indigo-600 p-5 rounded-2xl items-center"
              onPress={handleCreateProject}
            >
              <Text className="text-white font-bold text-lg">Stwórz Projekt</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="mt-4 mb-6 items-center"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-slate-500">Anuluj</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;
