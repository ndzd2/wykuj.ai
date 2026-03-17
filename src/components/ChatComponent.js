import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Modal, Alert } from 'react-native';
import { Send, User, Bot, Sparkles, Plus, History, X, MessageSquare, Trash2, Search, Volume2, Square } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { aiService } from '../services/aiService';
import { useStore } from '../store/useStore';

const ChatComponent = () => {
  const { currentProject, chatMessages, chatSessions, currentSession, sendChatMessage, createNewSession, switchSession, deleteChatSession, updateSessionTitle } = useStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [speakingId, setSpeakingId] = useState(null);
  const flatListRef = useRef();

  // Sync edited title when session changes
  useEffect(() => {
    setEditedTitle(currentSession?.title || '');
  }, [currentSession]);

  const handleSend = async () => {
    if (!input.trim() || !currentProject) return;

    const messageContent = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      await sendChatMessage(currentProject.id, messageContent);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleSpeak = (text, id) => {
    if (speakingId === id) {
      Speech.stop();
      setSpeakingId(null);
    } else {
      Speech.stop();
      setSpeakingId(id);
      Speech.speak(text, {
        language: 'pl-PL',
        onDone: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
      });
    }
  };

  const handleSaveTitle = async () => {
    if (currentSession && editedTitle.trim() && editedTitle !== currentSession.title) {
      await updateSessionTitle(currentSession.id, editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleNewChat = async () => {
    if (!currentProject) return;
    await createNewSession(currentProject.id);
  };

  const renderMessage = ({ item }) => (
    <View className={`mb-4 flex-row ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <View 
        className={`max-w-[82%] px-4 py-3 rounded-2xl ${
          item.role === 'user' 
            ? 'bg-indigo-600 rounded-tr-none' 
            : 'bg-slate-800 rounded-tl-none border border-slate-700/40'
        }`}
        style={item.role === 'user' ? {
          shadowColor: '#6366f1',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3
        } : {}}
      >
        <View className="flex-row justify-between items-center mb-1">
          <View className="flex-row items-center">
            <Text className={`text-[10px] uppercase font-black tracking-widest ${item.role === 'user' ? 'text-indigo-200' : 'text-indigo-400'}`}>
              {item.role === 'user' ? 'TY' : 'AI WYKUJ'}
            </Text>
          </View>
          
          {item.role === 'assistant' && (
            <TouchableOpacity 
              onPress={() => handleSpeak(item.content, item.id)}
              className="ml-2"
            >
              {speakingId === item.id ? (
                <Square size={12} color="#818cf8" fill="#818cf8" />
              ) : (
                <Volume2 size={12} color="#64748b" />
              )}
            </TouchableOpacity>
          )}
        </View>
        
        <Text className="text-white text-[15px] leading-6 font-medium">
          {item.content}
        </Text>
      </View>
    </View>
  );

  const renderSessionItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => {
        switchSession(item);
        setHistoryVisible(false);
      }}
      className={`p-4 mb-2 rounded-xl flex-row items-center justify-between ${
        currentSession?.id === item.id ? 'bg-indigo-600/20 border border-indigo-500/50' : 'bg-slate-800 border border-slate-700'
      }`}
    >
      <View className="flex-1 flex-row items-center">
        <MessageSquare size={16} color={currentSession?.id === item.id ? '#818cf8' : '#64748b'} className="mr-3" />
        <View className="flex-1">
          <Text className="text-white font-medium" numberOfLines={1}>{item.title}</Text>
          <Text className="text-slate-500 text-[10px]">{new Date(item.created_at).toLocaleString('pl-PL')}</Text>
        </View>
      </View>
      <TouchableOpacity 
        onPress={() => {
          Alert.alert(
            "Usuń czat",
            `Czy na pewno chcesz usunąć czat "${item.title}"?`,
            [
              { text: "Anuluj", style: "cancel" },
              { text: "Usuń", onPress: () => deleteChatSession(item.id), style: "destructive" }
            ]
          );
        }} 
        className="p-2"
      >
        <Trash2 size={16} color="#f87171" opacity={0.6} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1">
      {/* Chat Header */}
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-slate-800">
        <TouchableOpacity 
          onPress={() => setHistoryVisible(true)}
          className="p-2 bg-slate-800 rounded-lg border border-slate-700"
        >
          <History size={18} color="#6366f1" />
        </TouchableOpacity>

        <View className="flex-1 mx-4">
          {isEditingTitle ? (
            <TextInput
              className="text-white font-bold text-center bg-slate-800 px-2 py-1 rounded border border-indigo-500/50"
              value={editedTitle}
              onChangeText={setEditedTitle}
              onBlur={handleSaveTitle}
              onSubmitEditing={handleSaveTitle}
              autoFocus
              maxLength={50}
            />
          ) : (
            <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
              <Text className="text-white font-bold text-center text-sm" numberOfLines={1}>
                {currentSession?.title || 'Nowy czat'}
              </Text>
              <Text className="text-indigo-400/50 text-[8px] text-center font-bold uppercase tracking-tighter">Kliknij, by zmienić nazwę</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          onPress={handleNewChat}
          className="flex-row items-center bg-indigo-600 px-3 py-2 rounded-lg"
        >
          <Plus size={16} color="white" className="mr-1" />
          <Text className="text-white text-xs font-bold">Nowy</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={chatMessages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        className="flex-1 pt-2"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View className="items-center mt-20 px-10">
            <View className="bg-indigo-600/10 p-6 rounded-full mb-6">
              <Sparkles color="#6366f1" size={40} />
            </View>
            <Text className="text-white text-xl font-bold mb-2">Cześć! O czym pogadamy?</Text>
            <Text className="text-slate-500 text-center leading-5">
              Zadaj pytanie dotyczące Twoich materiałów. Historia tej rozmowy zostanie zapisana automatycznie.
            </Text>
          </View>
        }
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 100}
        style={{ paddingHorizontal: 16 }}
      >
        {isTyping && (
          <View className="ml-2 mb-2 flex-row items-center">
            <View className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1" />
            <Text className="text-indigo-400 text-xs font-medium">AI wykuwa odpowiedź...</Text>
          </View>
        )}

        <View className="flex-row items-end mb-6 bg-slate-800 rounded-2xl p-1 border border-slate-700 shadow-lg">
          <TextInput
            className="flex-1 text-white p-3 min-h-[48] max-h-32 text-base"
            placeholder="Napisz do AI..."
            placeholderTextColor="#64748b"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity 
            className={`p-3 rounded-xl ml-1 mb-1 ${input.trim() ? 'bg-indigo-600' : 'bg-slate-700'}`}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Send color="white" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* History Modal */}
      <Modal
        visible={historyVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHistoryVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-slate-900 border-t border-slate-700 rounded-t-3xl h-[70%] p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-2xl font-bold">Historia czatów</Text>
              <TouchableOpacity onPress={() => { setHistoryVisible(false); setHistorySearch(''); }}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* History Search Bar */}
            <View className="flex-row items-center bg-slate-800 px-4 py-2 rounded-xl mb-4 border border-slate-700">
              <Search size={16} color="#64748b" className="mr-2" />
              <TextInput 
                className="flex-1 text-white text-xs"
                placeholder="Szukaj w historii..."
                placeholderTextColor="#64748b"
                value={historySearch}
                onChangeText={setHistorySearch}
              />
              {historySearch.length > 0 && (
                <TouchableOpacity onPress={() => setHistorySearch('')}>
                  <X size={14} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={chatSessions.filter(s => s.title.toLowerCase().includes(historySearch.toLowerCase()))}
              renderItem={renderSessionItem}
              keyExtractor={item => item.id.toString()}
              ListEmptyComponent={
                <View className="items-center py-20">
                  <Text className="text-slate-500">Brak historii rozmów.</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ChatComponent;
