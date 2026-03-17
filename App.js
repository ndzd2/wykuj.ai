import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import { LogOut } from 'lucide-react-native';

import HomeScreen from './src/screens/HomeScreen';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

import { initDatabase } from './src/database/db';
import { useStore } from './src/store/useStore';

const Stack = createNativeStackNavigator();

export default function App() {
  const user = useStore(state => state.user);
  const checkSession = useStore(state => state.checkSession);
  const logout = useStore(state => state.logout);

  useEffect(() => {
    initDatabase()
      .then(() => {
        console.log('Database initialized successfully');
        checkSession();
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
            headerShadowVisible: false,
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: '#0f172a',
            }
          }}
        >
          {user ? (
            <>
              <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{ 
                  title: 'Wykuj.AI',
                  headerRight: () => (
                    <TouchableOpacity onPress={logout}>
                      <LogOut size={22} color="#fff" />
                    </TouchableOpacity>
                  )
                }}
              />
              <Stack.Screen 
                name="ProjectDetail" 
                component={ProjectDetailScreen}
                options={({ route }) => ({ title: route.params.project.name })}
              />
            </>
          ) : (
            <>
              <Stack.Screen 
                name="Login" 
                component={LoginScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Register" 
                component={RegisterScreen}
                options={{ headerShown: false }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
