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
      habitsArray.forEach(habit => checkBadge(habit, false));
      setHabits(habitsArray);
    } catch (error) {
      console.error('Load error:', error);
      Alert.alert('Load Error', 'Could not load habits.');
    }
  };

  const logHabit = async (habitId) => {
    try {
      const stored = await AsyncStorage.getItem('habits') || '[]';
      let habitsArray = JSON.parse(stored);
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

        checkBadge(habit, true);
        checkNudge(habit);
      }
    } catch (error) {
      Alert.alert('Error', 'Logging failed—check console.');
      console.error('Log error:', error);
    }
  };

  const checkBadge = (habit, showAlert = true) => {
    const streak = habit.streak;
    const currentBadge = habit.badge || 'None';
    let newBadge = 'None';
    if (streak >= 30) newBadge = 'Legendary Master';
    else if (streak >= 14) newBadge = 'Seasoned Hunter';
    else if (streak >= 7) newBadge = 'Beginner Warrior';

    if (newBadge !== currentBadge) {
      habit.badge = newBadge;
      if (showAlert) {
        Alert.alert('Badge Unlocked!', `Congratulations! You've earned the ${newBadge} badge for ${habit.name}! 🏆`);
      }
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
      let habitsArray = JSON.parse(stored);
      const index = habitsArray.findIndex(h => h.id === editingHabit);
      if (index !== -1) {
        habitsArray[index].name = editName;
        habitsArray[index].frequency = editFrequency;
        habitsArray[index].reminderTime = editTime.toTimeString().slice(0, 5);
        habitsArray.forEach(habit => checkBadge(habit, false));
        await AsyncStorage.setItem('habits', JSON.stringify(habitsArray));
        setHabits(habitsArray);
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
    Alert.alert('Delete Habit', 'Are you sure? This will reset your streak.', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const stored = await AsyncStorage.getItem('habits') || '[]';
          let filtered = JSON.parse(stored).filter(h => h.id !== habitId);
          filtered.forEach(habit => checkBadge(habit, false));
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
      datasets: [{ data: Array.from({ length: item.streak + 1 }, (_, i) => i), color: (o) => `rgba(37,225,237,${o})`, strokeWidth: 3 }],
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
        <LineChart data={chartData} width={screenWidth - 40} height={120}
          chartConfig={{
            backgroundColor: '#1E293B',
            backgroundGradientFrom: '#1E293B',
            backgroundGradientTo: '#1E293B',
            decimalPlaces: 0,
            color: (o) => `rgba(255,75,87,${o})`,
            labelColor: () => '#E2E8F0',
            style: { borderRadius: 16 },
            propsForDots: { r: '6', strokeWidth: '2', stroke: '#FF4A57' }
          }}
          bezier
          style={styles.chart}
        />
        <Button title="Log Today" onPress={() => logHabit(item.id)} color="#ED1E79" />
        <Button title="Edit" onPress={() => editHabit(item)} color="#25E1ED" />
        <Button title="Delete" onPress={() => deleteHabit(item.id)} color="#f44336" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {habits.length === 0 ? (
        <Text style={styles.emptyText}>No habits yet—create one to get started!</Text>
      ) : (
        <FlatList data={habits} renderItem={renderHabit} keyExtractor={item => item.id.toString()} style={styles.list} />
      )}

      {/* Bottom Bar: Logout (left) + Create FAB (right) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Habit')}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

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
  container: { flex: 1, backgroundColor: '#0F172A', padding: 20 },
  list: { flex: 1 },
  habitItem: { padding: 15, borderWidth: 1, borderColor: '#25E1ED', backgroundColor: '#1E293B', marginBottom: 15, borderRadius: 10 },
  habitName: { fontSize: 20, fontWeight: 'bold', color: '#FF4A57' },
  habitDetail: { fontSize: 14, color: '#E2E8F0', marginBottom: 5 },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  badgeIcon: { width: 50, height: 50, marginRight: 10 },
  badge: { fontSize: 14, color: '#FFEB0B', fontWeight: 'bold' },
  chart: { marginVertical: 10, borderRadius: 10 },
  emptyText: { textAlign: 'center', color: '#E2E8F0', fontStyle: 'italic', marginTop: 50, fontSize: 18 },
  bottomBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderColor: '#25E1ED'
  },
  logoutButton: { padding: 10 },
  logoutText: { color: '#FF4A57', fontWeight: 'bold' },
  fab: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ED1E79',
    borderRadius: 35,
    elevation: 10,
  },
  fabText: { fontSize: 40, color: 'white' },
  modalContainer: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#0F172A' },
  modalTitle: { fontSize: 24, textAlign: 'center', marginBottom: 20, color: '#25E1ED' },
  input: { borderWidth: 1, borderColor: '#25E1ED', padding: 12, margin: 10, borderRadius: 5, backgroundColor: '#1E293B', color: '#E2E8F0' },
  timePickerContainer: { margin: 20, alignItems: 'center' },
});