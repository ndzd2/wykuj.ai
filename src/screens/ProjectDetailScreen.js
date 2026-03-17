import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { MessageSquare, Paperclip, FileText, GraduationCap } from 'lucide-react-native';
import ChatComponent from '../components/ChatComponent';
import MaterialsComponent from '../components/MaterialsComponent';
import NotesComponent from '../components/NotesComponent';
import StudyModule from '../components/StudyModule';

const ProjectDetailScreen = ({ route, navigation }) => {
  const { project } = route.params;
  const { selectProject } = useStore();
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    selectProject(project);
  }, [project]);

  const renderContent = () => {
    switch (activeTab) {
      case 'chat': return <ChatComponent />;
      case 'materials': return <MaterialsComponent />;
      case 'notes': return <NotesComponent />;
      case 'study': return <StudyModule />;
      default: return <ChatComponent />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }} edges={['bottom', 'left', 'right']}>
      <View style={{ 
        flexDirection: 'row', 
        backgroundColor: '#1e293b', 
        padding: 6, 
        marginHorizontal: 16, 
        marginVertical: 8, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: '#334155' 
      }}>
        <TabButton 
          active={activeTab === 'chat'} 
          icon={<MessageSquare size={18} />} 
          onPress={() => setActiveTab('chat')} 
          label="Czat AI"
        />
        <TabButton 
          active={activeTab === 'study'} 
          icon={<GraduationCap size={18} />} 
          onPress={() => setActiveTab('study')} 
          label="Nauka"
        />
        <TabButton 
          active={activeTab === 'materials'} 
          icon={<Paperclip size={18} />} 
          onPress={() => setActiveTab('materials')} 
          label="Materiały"
        />
        <TabButton 
          active={activeTab === 'notes'} 
          icon={<FileText size={18} />} 
          onPress={() => setActiveTab('notes')} 
          label="Notatki"
        />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const TabButton = ({ active, icon, onPress, label }) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: active ? '#4f46e5' : 'transparent',
      }}
    >
      {React.cloneElement(icon, { color: active ? 'white' : '#94a3b8' })}
      {active && (
        <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 6, fontSize: 11 }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default ProjectDetailScreen;
