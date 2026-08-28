import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type BottomNavbarProps = {
  activeTab: string;
  onTabPress: (tab: string) => void;
};

export default function BottomNavbar({
  activeTab,
  onTabPress,
}: BottomNavbarProps) {
  return (
    <View style={styles.container}>

      <Pressable
        style={styles.item}
        onPress={() => onTabPress('home')}
      >
        <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={24}
            color={activeTab === 'home' ? '#2563EB' : '#64748B'}
        />  

        <Text
          style={[
            styles.label,
            activeTab === 'home' && styles.active,
          ]}
        >
          Home
        </Text>
      </Pressable>

      <Pressable
        style={styles.item}
        onPress={() => onTabPress('attendance')}
      >
        <Ionicons
            name={
                activeTab === 'attendance'
                ? 'calendar'
                : 'calendar-outline'
            }
            size={24}
            color={
                activeTab === 'attendance'
                ? '#2563EB'
                : '#64748B'
            }
        />

        <Text
          style={[
            styles.label,
            activeTab === 'attendance' && styles.active,
          ]}
        >
          Absensi
        </Text>
      </Pressable>

      <Pressable
        style={styles.item}
        onPress={() => onTabPress('leave')}
      >
        <Ionicons
            name={
                activeTab === 'leave'
                ? 'document-text'
                : 'document-text-outline'
            }
            size={24}
            color={
                activeTab === 'leave'
                ? '#2563EB'
                : '#64748B'
            }
        />

        <Text
          style={[
            styles.label,
            activeTab === 'leave' && styles.active,
          ]}
        >
          Izin
        </Text>
      </Pressable>

      <Pressable
        style={styles.item}
        onPress={() => onTabPress('profile')}
      >
        <Ionicons
            name={
                activeTab === 'profile'
                ? 'person'
                : 'person-outline'
            }
            size={24}
            color={
                activeTab === 'profile'
                ? '#2563EB'
                : '#64748B'
            }
        />

        <Text
          style={[
            styles.label,
            activeTab === 'profile' && styles.active,
          ]}
        >
          Profile
        </Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 20,
    marginBottom: 4,
  },

  label: {
    fontSize: 12,
    color: '#64748B',
  },

  active: {
    color: '#2563EB',
    fontWeight: '700',
  },
});