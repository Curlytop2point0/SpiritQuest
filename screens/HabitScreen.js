import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HabitScreen({ navigation }) {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('');
  const [time, setTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const onChangeTime = (event, selectedTime) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedTime) setTime(selectedTime);
  };

  const handleCreate = async () => {
    if (!name || !frequency) {
      Alert.alert('Error', 'Name and frequency required.');
      return;
    }

    const reminderTime = time.toTimeString().slice(0, 5); // "HH:MM"

    const newHabit = {
      id: Date.now().toString(),
      name,
      frequency,
      streak: 0,
      lastLog: null,
      reminderTime,
    };

    try {
      const existing = await AsyncStorage.getItem('habits') || '[]';
      const habits = JSON.parse(existing);
      habits.push(newHabit);
      await AsyncStorage.setItem('habits', JSON.stringify(habits));
      Alert.alert('Success!', `Created ${name}! Reminder set for ${reminderTime} daily.`);
      navigation.navigate('Dashboard');
    } catch (error) {
      Alert.alert('Error', 'Save failed.');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Habit</Text>
      <TextInput style={styles.input} placeholder="Habit Name (e.g., Study)" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Frequency (e.g., Daily)" value={frequency} onChangeText={setFrequency} />

      <View style={styles.timePickerContainer}>
        <Button title={`Reminder Time: ${time.toTimeString().slice(0, 5)}`} onPress={() => setShowPicker(true)} />
        {showPicker && (
          <DateTimePicker
            value={time}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onChangeTime}
          />
        )}
      </View>

      <Button title="Create Habit" onPress={handleCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, textAlign: 'center', marginBottom: 20, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, margin: 10, borderRadius: 5, backgroundColor: 'white' },
  timePickerContainer: { margin: 20, alignItems: 'center' },
});