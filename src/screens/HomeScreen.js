import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, Animated, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { Plus, BookOpen, Menu, User, Settings, BarChart2, Info, LogOut, Mail, ChevronRight, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

const HomeScreen = ({ navigation }) => {
  const { projects, addProject, user, logout } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const toggleDrawer = (open) => {
    if (open) setDrawerOpen(true);
    Animated.timing(drawerAnim, {
      toValue: open ? 0 : -DRAWER_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (!open) setDrawerOpen(false);
    });
  };

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
    <SafeAreaView className="flex-1 bg-slate-900 px-4" edges={['bottom', 'top', 'left', 'right']}>
      {/* Header with Centered Title */}
      <View className="flex-row justify-between items-center mb-8 mt-4 relative h-12">
        <TouchableOpacity 
          onPress={() => toggleDrawer(true)}
          className="p-1 z-10"
        >
          <Menu color="white" size={28} />
        </TouchableOpacity>

        <View className="absolute left-0 right-0 top-0 bottom-0 items-center justify-center">
          <Text className="text-white text-2xl font-black tracking-tight">Moje Projekty</Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => setModalVisible(true)}
          className="p-1 z-10"
        >
          <Plus color="white" size={32} />
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
      {/* Side Drawer Overlay */}
      {drawerOpen && (
        <Pressable 
          className="absolute inset-0 bg-black/60 z-40"
          onPress={() => toggleDrawer(false)}
        />
      )}

      {/* Side Drawer Content */}
      <Animated.View 
        style={{
          transform: [{ translateX: drawerAnim }],
          width: DRAWER_WIDTH,
        }}
        className="absolute top-0 bottom-0 left-0 bg-slate-900 border-r border-slate-800 z-50 pt-14"
      >
        <ScrollView className="flex-1 px-6">
          {/* User Profile Section */}
          <View className="items-center mb-8 py-6 bg-slate-800/50 rounded-3xl border border-slate-700/50">
            <View className="w-16 h-16 bg-indigo-600 rounded-full items-center justify-center mb-3 shadow-lg shadow-indigo-500/40">
              <User color="white" size={32} />
            </View>
            <Text className="text-white font-bold text-lg">{user?.email?.split('@')[0] || 'Użytkownik'}</Text>
            <Text className="text-slate-500 text-xs">{user?.email}</Text>
          </View>

          {/* Menu Items */}
          <DrawerItem 
            icon={<BarChart2 size={20} color="#818cf8" />} 
            label="Statystyki Nauki" 
            onPress={() => {}} 
          />
          <DrawerItem 
            icon={<Settings size={20} color="#94a3b8" />} 
            label="Ustawienia Konta" 
            onPress={() => {}} 
          />
          <DrawerItem 
            icon={<Mail size={20} color="#94a3b8" />} 
            label="Kontakt i Wsparcie" 
            onPress={() => {}} 
          />
          <DrawerItem 
            icon={<Info size={20} color="#94a3b8" />} 
            label="O aplikacji" 
            onPress={() => {}} 
          />
          
          <View className="h-[1px] bg-slate-800 my-4" />
          
          <View className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20 mb-6">
            <View className="flex-row items-center mb-2">
              <Sparkles size={16} color="#818cf8" className="mr-2" />
              <Text className="text-indigo-400 font-bold text-xs uppercase tracking-wider">Premium Plan</Text>
            </View>
            <Text className="text-slate-400 text-[10px] leading-4">Uzyskaj dostęp do nielimitowanych fiszek i zaawansowanych modeli AI.</Text>
          </View>
        </ScrollView>

        {/* Footer / Logout */}
        <View className="p-6 border-t border-slate-800 mb-6">
          <TouchableOpacity 
            className="flex-row items-center p-4 bg-slate-800 rounded-2xl border border-slate-700"
            onPress={logout}
          >
            <LogOut color="#ef4444" size={20} />
            <Text className="text-red-500 font-bold ml-3">Wyloguj się</Text>
          </TouchableOpacity>
          <View className="items-center mt-6">
            <Text className="text-slate-600 text-[10px] font-bold">WYKUJ.AI v1.2.0</Text>
            <Text className="text-slate-700 text-[8px] uppercase tracking-tighter mt-1">Stworzone z pasją dla Studentów</Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const DrawerItem = ({ icon, label, onPress }) => (
  <TouchableOpacity 
    className="flex-row items-center justify-between py-4 mb-2"
    onPress={onPress}
  >
    <View className="flex-row items-center">
      <View className="w-10 h-10 items-center justify-center bg-slate-800 rounded-xl mr-3">
        {icon}
      </View>
      <Text className="text-slate-300 font-medium">{label}</Text>
    </View>
    <ChevronRight size={16} color="#475569" />
  </TouchableOpacity>
);

export default HomeScreen;
