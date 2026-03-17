import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { User, Mail, Lock, ChevronLeft, Save } from 'lucide-react-native';

export default function ProfileScreen({ navigation }) {
  const { user, updateProfile, updateEmail, updatePassword, loading } = useStore();
  
  // Profile Info State
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  // Email Info State
  const [newEmail, setNewEmail] = useState(user?.email || '');
  
  // Password Info State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone
      });
      Alert.alert('Sukces', 'Profil został zaktualizowany.');
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zaktualizować profilu.');
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user?.email) {
      Alert.alert('Info', 'Podaj nowy adres e-mail.');
      return;
    }
    try {
      await updateEmail(newEmail);
      Alert.alert('Sukces', 'Adres e-mail został zmieniony.');
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zmienić adresu e-mail.');
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Błąd', 'Proszę podać aktualne hasło.');
      return;
    }
    if (!newPassword || newPassword !== confirmPassword) {
      Alert.alert('Błąd', 'Hasła muszą być identyczne.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Błąd', 'Nowe hasło musi mieć co najmniej 6 znaków.');
      return;
    }
    try {
      await updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Sukces', 'Hasło zostało zmienione.');
    } catch (error) {
      Alert.alert('Błąd', error.message || 'Nie udało się zmienić hasła.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ustawienia Profilu</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <User color="#6366f1" size={20} />
            </View>
            <Text style={styles.sectionTitle}>Dane osobowe</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Imię</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Jan"
              placeholderTextColor="#64748b"
            />
            
            <Text style={styles.label}>Nazwisko</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Kowalski"
              placeholderTextColor="#64748b"
            />
            
            <Text style={styles.label}>Numer telefonu</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+48 123 456 789"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Zapisz dane</Text>}
          </TouchableOpacity>
        </View>

        {/* Change Email Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#0ea5e920' }]}>
              <Mail color="#0ea5e9" size={20} />
            </View>
            <Text style={styles.sectionTitle}>Zmień e-mail</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nowy adres e-mail</Text>
            <TextInput
              style={styles.input}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="twój@nowy-email.com"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: '#0ea5e9' }]} 
            onPress={handleUpdateEmail}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>Aktualizuj e-mail</Text>
          </TouchableOpacity>
        </View>

        {/* Change Password Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#f43f5e20' }]}>
              <Lock color="#f43f5e" size={20} />
            </View>
            <Text style={styles.sectionTitle}>Zmień hasło</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Aktualne hasło</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry
            />
            
            <Text style={styles.label}>Nowe hasło</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry
            />
            
            <Text style={styles.label}>Potwierdź nowe hasło</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: '#f43f5e' }]} 
            onPress={handleUpdatePassword}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>Zmień hasło</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#6366f120',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    color: 'white',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
