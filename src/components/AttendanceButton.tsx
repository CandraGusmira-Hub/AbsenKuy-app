import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

export default function AttendanceButton() {
  const handlePress = () => {
    router.push('/attendance-form');
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
      onPress={handlePress}
    >
      <Text style={styles.text}>
        Absen
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPressed: {
    backgroundColor: '#1D4ED8',
    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});