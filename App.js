import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import { initDatabase } from './src/database/db';
import { useStore } from './src/store/useStore';

const Stack = createNativeStackNavigator();

export default function App() {
  const fetchProjects = useStore(state => state.fetchProjects);

  useEffect(() => {
    initDatabase()
      .then(() => {
        console.log('Database initialized successfully');
        fetchProjects();
      })
      .catch(err => console.error('Database initialization failed', err));
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0f172a',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: '#0f172a',
            }
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Wykuj.AI' }}
          />
          <Stack.Screen 
            name="ProjectDetail" 
            component={ProjectDetailScreen}
            options={({ route }) => ({ title: route.params.project.name })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
