import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password required.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    try {
      console.log('Register:', email, password);
      Alert.alert('Success!', 'Registration complete. Welcome to your SpiritQuest.');
      navigation.navigate('Dashboard');
    } catch (error) {
      Alert.alert('Error', 'Registration failed.');
      console.error(error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.inner}>
        {/* Your icon at the top */}
        <Image 
          source={require('../assets/icon.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />

        <Text style={styles.title}>Register to begin your SpiritQuest.</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#64748B"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#64748B"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button title="Begin SpiritQuest" onPress={handleRegister} color="#ED1E79" />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0F172A',
    justifyContent: 'center'
  },
  inner: { 
    padding: 30,
    alignItems: 'center'
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: { 
    fontSize: 26, 
    textAlign: 'center', 
    color: '#25E1ED', 
    marginBottom: 40, 
    fontWeight: 'bold',
    paddingHorizontal: 20
  },
  input: { 
    width: '100%',
    borderWidth: 1, 
    borderColor: '#25E1ED', 
    padding: 15, 
    marginBottom: 20, 
    borderRadius: 10, 
    backgroundColor: '#1E293B', 
    color: '#E2E8F0',
    fontSize: 16
  },
});