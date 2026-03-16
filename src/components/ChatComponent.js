import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Send, User, Bot, Sparkles } from 'lucide-react-native';
import { aiService } from '../services/aiService';
import { useStore } from '../store/useStore';

const ChatComponent = () => {
  const { materials } = useStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const context = materials.map(m => `Plik: ${m.name}\nTreść: ${m.content}`).join('\n\n');
      const systemMessage = { 
        role: 'system', 
        content: `Jesteś asystentem naukowym. Odpowiadaj na pytania na podstawie poniższych materiałów:\n\n${context}` 
      };

      const response = await aiService.sendMessage([systemMessage, ...newMessages]);
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: 'assistant', content: 'Przepraszam, wystąpił błąd podczas pobierania odpowiedzi.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View className={`mb-4 flex-row ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <View className={`max-w-[85%] p-4 rounded-2xl ${
        item.role === 'user' ? 'bg-indigo-600 rounded-tr-none shadow-sm' : 'bg-slate-800 rounded-tl-none border border-slate-700'
      }`}>
        <View className="flex-row items-center mb-1.5">
          {item.role === 'user' ? (
            <User size={10} color="#c7d2fe" style={{ marginRight: 4 }} />
          ) : (
            <Bot size={10} color="#6366f1" style={{ marginRight: 4 }} />
          )}
          <Text className={`text-[10px] uppercase font-bold tracking-widest ${item.role === 'user' ? 'text-indigo-200' : 'text-indigo-400'}`}>
            {item.role === 'user' ? 'Ty' : 'AI Wykuj'}
          </Text>
        </View>
        <Text className="text-white text-[15px] leading-6">{item.content}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(_, index) => index.toString()}
        className="flex-1 pt-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View className="items-center mt-20 px-10">
            <View className="bg-indigo-600/10 p-6 rounded-full mb-6">
              <Sparkles color="#6366f1" size={40} />
            </View>
            <Text className="text-white text-xl font-bold mb-2">Cześć! O czym pogadamy?</Text>
            <Text className="text-slate-500 text-center leading-5">
              Zadaj pytanie dotyczące Twoich materiałów, a ja pomogę Ci je zrozumieć i zapamiętać.
            </Text>
          </View>
        }
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 100}
      >
        {isTyping && (
          <View className="ml-2 mb-2 flex-row items-center">
            <View className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1" />
            <Text className="text-indigo-400 text-xs font-medium">AI wykuwa odpowiedź...</Text>
          </View>
        )}

        <View className="flex-row items-end mb-6 bg-slate-800 rounded-2xl p-2 border border-slate-700 shadow-lg">
          <TextInput
            className="flex-1 text-white p-3 min-h-[48] max-h-32 text-base"
            placeholder="Napisz do AI..."
            placeholderTextColor="#64748b"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity 
            className={`p-3 rounded-xl ml-2 ${input.trim() ? 'bg-indigo-600' : 'bg-slate-700'}`}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Send color="white" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatComponent;
