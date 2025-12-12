import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    if (email && password.length >= 6) {
      console.log('Register:', email, password);
      Alert.alert('Success!', 'Welcome to SpiritQuest. Let\'s create a habit!', [
        { text: 'OK', onPress: () => navigation.navigate('Habit') }
      ]);
    } else {
      Alert.alert('Error', 'Email required; password 6+ chars.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register for SpiritQuest</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Register" onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, textAlign: 'center', marginBottom: 20, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', margin: 10, padding: 12, borderRadius: 5, backgroundColor: 'white' },
});