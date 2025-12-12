import { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert, Modal, TextInput, Dimensions, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Engine } from 'json-rules-engine';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const badgeIcons = {
  'Beginner Warrior': require('../assets/badges/Beginnerbadge.png'),
  'Seasoned Hunter': require('../assets/badges/Seasonedbadge.png'),
  'Legendary Master': require('../assets/badges/Legendarybadge.png'),
};

export default function DashboardScreen({ navigation }) {
  const [habits, setHabits] = useState([]);
  const [editingHabit, setEditingHabit] = useState(null);
  const [editName, setEditName] = useState('');
  const [editFrequency, setEditFrequency] = useState('');
  const [editTime, setEditTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const stored = await AsyncStorage.getItem('habits') || '[]';
      let habitsArray = JSON.parse(stored);
      habitsArray.forEach(habit => checkBadge(habit));
      setHabits(habitsArray);
    } catch (error) {
      console.error('Load error:', error);
      Alert.alert('Load Error', 'Could not load habits.');
    }
  };

  const logHabit = async (habitId) => {
    try {
      const stored = await AsyncStorage.getItem('habits') || '[]';
      const habitsArray = JSON.parse(stored);
      const habitIndex = habitsArray.findIndex(h => h.id === habitId);
      if (habitIndex !== -1) {
        const habit = habitsArray[habitIndex];
        const today = new Date().toISOString().split('T')[0];
        if (habit.lastLog && habit.lastLog !== today) {
          habit.streak = 1;
          Alert.alert('Streak Reset', 'New day! Starting fresh—log daily to build momentum.');
        } else if (habit.lastLog !== today) {
          habit.streak = 1;
        } else {
          habit.streak += 1;
        }
        habit.lastLog = today;
        await AsyncStorage.setItem('habits', JSON.stringify(habitsArray));
        setHabits([...habitsArray]);
        Alert.alert('Logged!', `Streak: ${habit.streak}! ${habit.streak > 1 ? 'On fire!' : 'First step taken!'}`);

        checkBadge(habit);
        checkNudge(habit);
      }
    } catch (error) {
      Alert.alert('Error', 'Logging failed—check console.');
      console.error('Log error:', error);
    }
  };

  const checkBadge = (habit) => {
    const streak = habit.streak;
    let newBadge = 'None';
    if (streak >= 30) newBadge = 'Legendary Master';
    else if (streak >= 14) newBadge = 'Seasoned Hunter';
    else if (streak >= 7) newBadge = 'Beginner Warrior';

    if (newBadge !== (habit.badge || 'None')) {
      habit.badge = newBadge;
      Alert.alert('Badge Unlocked!', `Congratulations! You've earned the ${newBadge} badge for ${habit.name}! 🏆`);
    }
  };

  const checkNudge = (habit) => {
    try {
      const lowStreakRule = {
        conditions: { all: [{ fact: 'streak', operator: 'lessThan', value: 3 }] },
        event: { type: 'low', params: { message: `Streak ${habit.streak}? Almost there—try a 5-min ${habit.name} session tomorrow! 💪` } }
      };
      const highStreakRule = {
        conditions: { all: [{ fact: 'streak', operator: 'greaterThanInclusive', value: 3 }] },
        event: { type: 'high', params: { message: `Awesome ${habit.streak}-day streak on ${habit.name}! You're building momentum—keep it up! 🚀` } }
      };
      const engine = new Engine();
      engine.addRule(lowStreakRule);
      engine.addRule(highStreakRule);
      engine.run({ streak: habit.streak }).then(({ events }) => {
        if (events.length > 0) Alert.alert('Motivation Boost', events[0].params.message);
      }).catch(e => console.error('Nudge error:', e));
    } catch (error) {
      console.error('Nudge error:', error);
    }
  };

  const editHabit = (habit) => {
    setEditingHabit(habit.id);
    setEditName(habit.name);
    setEditFrequency(habit.frequency);
    const [hours, minutes] = (habit.reminderTime || '20:00').split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    setEditTime(time);
    setModalVisible(true);
  };

  const saveEdit = async () => {
    try {
      const stored = await AsyncStorage.getItem('habits') || '[]';
      const habitsArray = JSON.parse(stored);
      const index = habitsArray.findIndex(h => h.id === editingHabit);
      if (index !== -1) {
        habitsArray[index].name = editName;
        habitsArray[index].frequency = editFrequency;
        habitsArray[index].reminderTime = editTime.toTimeString().slice(0, 5);
        await AsyncStorage.setItem('habits', JSON.stringify(habitsArray));
        setHabits([...habitsArray]);
        Alert.alert('Saved!', 'Habit updated!');
      }
      setModalVisible(false);
      setEditingHabit(null);
    } catch (error) {
      Alert.alert('Error', 'Edit failed.');
      console.error('Edit error:', error);
    }
  };

  const deleteHabit = (habitId) => {
    Alert.alert('Delete Habit', 'Are you sure? This resets your streak.', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const stored = await AsyncStorage.getItem('habits') || '[]';
          const filtered = JSON.parse(stored).filter(h => h.id !== habitId);
          await AsyncStorage.setItem('habits', JSON.stringify(filtered));
          setHabits(filtered);
          Alert.alert('Deleted!', 'Habit removed.');
        } catch (error) {
          Alert.alert('Error', 'Delete failed.');
          console.error('Delete error:', error);
        }
      } }
    ]);
  };

  // NEW: Logout function
  const logout = async () => {
    Alert.alert('Logout', 'This will clear all habits and return to registration.', [
      { text: 'Cancel' },
      { 
        text: 'Logout', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            navigation.navigate('Register');
          } catch (error) {
            console.error('Logout error:', error);
          }
        }
      }
    ]);
  };

  const renderHabit = ({ item }) => {
    const chartData = {
      labels: Array.from({ length: item.streak + 1 }, (_, i) => i.toString()),
      datasets: [{ data: Array.from({ length: item.streak + 1 }, (_, i) => i), color: (o) => `rgba(134,65,244,${o})`, strokeWidth: 2 }],
    };

    const badgeImage = badgeIcons[item.badge] || null;

    return (
      <View style={styles.habitItem}>
        <Text style={styles.habitName}>{item.name}</Text>
        <Text style={styles.habitDetail}>{item.frequency} - Streak: {item.streak}</Text>
        <View style={styles.badgeContainer}>
          {badgeImage && <Image source={badgeImage} style={styles.badgeIcon} resizeMode="contain" />}
          <Text style={styles.badge}>{item.badge || 'No Badge Yet'}</Text>
        </View>
        <LineChart data={chartData} width={screenWidth - 40} height={100}
          chartConfig={{ backgroundColor: '#f5f5f5', backgroundGradientFrom: '#fff', backgroundGradientTo: '#f5f5f5', color: (o) => `rgba(0,0,0,${o})` }}
          style={styles.chart} />
        <Button title="Log Today" onPress={() => logHabit(item.id)} color="#4CAF50" />
        <Button title="Edit" onPress={() => editHabit(item)} color="#2196F3" />
        <Button title="Delete" onPress={() => deleteHabit(item.id)} color="#f44336" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Habits Dashboard</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {habits.length === 0 ? (
        <Text style={styles.emptyText}>No habits yet—create one to get started!</Text>
      ) : (
        <FlatList data={habits} renderItem={renderHabit} keyExtractor={item => item.id.toString()} style={styles.list} />
      )}

      {/* Floating Action Button – Create New Habit */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Habit')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Edit Modal */}
      <Modal animationType="slide" transparent={false} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Habit</Text>
          <TextInput style={styles.input} placeholder="New Name" value={editName} onChangeText={setEditName} />
          <TextInput style={styles.input} placeholder="New Frequency" value={editFrequency} onChangeText={setEditFrequency} />
          <View style={styles.timePickerContainer}>
            <Button title={`Reminder Time: ${editTime.toTimeString().slice(0, 5)}`} onPress={() => setShowTimePicker(true)} />
            {showTimePicker && (
              <DateTimePicker
                value={editTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event, selected) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (selected) setEditTime(selected);
                }}
              />
            )}
          </View>
          <Button title="Save" onPress={saveEdit} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} color="#666" />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  title: { fontSize: 24, color: '#333' },
  logoutButton: { padding: 10 },
  logoutText: { color: '#f44336', fontWeight: 'bold' },
  list: { flex: 1 },
  habitItem: { padding: 15, borderBottomWidth: 1, borderColor: '#ddd', backgroundColor: 'white', marginBottom: 10, borderRadius: 5 },
  habitName: { fontSize: 18, fontWeight: 'bold' },
  habitDetail: { fontSize: 14, color: '#666', marginBottom: 5 },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  badgeIcon: { width: 40, height: 40, marginRight: 10 },
  badge: { fontSize: 12, color: '#4CAF50', fontWeight: 'bold' },
  chart: { marginVertical: 8 },
  emptyText: { textAlign: 'center', color: '#999', fontStyle: 'italic' },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 30,
    bottom: 30,
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    elevation: 8,
  },
  fabText: { fontSize: 36, color: 'white' },
  modalContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  modalTitle: { fontSize: 24, textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 10, borderRadius: 5 },
  timePickerContainer: { margin: 20, alignItems: 'center' },
});