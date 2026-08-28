import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';

import AttendanceButton from '../components/AttendanceButton';
import AttendanceOutButton from '../components/AttendanceOutButton';
import AttendanceStatus from '../components/AttendanceStatus';

import BottomNavbar from '../components/BottomNavbar';

import AttendanceScreen from '../screen/Home/AttendanceScreen';
import LeaveScreen from '../screen/Home/LeaveScreen';
import ProfileScreen from '../screen/Home/ProfileScreen';

import { supabase } from '../lib/supabase';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nama, setNama] = useState('');

  // ========================================
  // JADWAL KERJA
  // ========================================

  const schedule = {
    masuk: '08:00',
    pulang: '17:00',
  };

  // ========================================
  // HARI LIBUR KHUSUS
  // Format: YYYY-MM-DD
  // ========================================

  const holidays: {
    [key: string]: string;
  } = {
    '2026-08-17': 'Hari Kemerdekaan Indonesia',
    // Tambahkan hari libur lainnya di sini
    // '2026-09-01': 'Hari Libur Khusus',
  };

  // ========================================
  // UPDATE JAM SETIAP DETIK
  // ========================================

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ========================================
  // AMBIL PROFILE
  // ========================================

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        'Gagal mengambil user:',
        userError.message
      );
      return;
    }

    if (!user) {
      console.log('User belum login');
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('nama')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error(
        'Gagal mengambil profile:',
        error.message
      );
      return;
    }

    setNama(data.nama);
  };

  // ========================================
  // CEK TANGGAL SEKARANG
  // ========================================

  const getDateKey = (date: Date) => {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // ========================================
  // CEK HARI KERJA / LIBUR
  // ========================================

  const dateKey = getDateKey(currentTime);

  const dayNumber = currentTime.getDay();

  const isWeekend =
    dayNumber === 0;

  const holidayName =
    holidays[dateKey];

  const isHoliday =
    isWeekend || !!holidayName;

  // ========================================
  // NAMA HARI
  // ========================================

  const dayName =
    currentTime.toLocaleDateString(
      'id-ID',
      {
        weekday: 'long',
      }
    );

  // ========================================
  // STATUS HARI
  // ========================================

  const dayStatus = isHoliday
    ? holidayName
      ? holidayName
      : 'Hari Libur'
    : 'Hari Kerja';

  // ========================================
  // RENDER SCREEN
  // ========================================

  const renderScreen = () => {
    switch (activeTab) {
      case 'attendance':
        return <AttendanceScreen />;

      case 'leave':
        return <LeaveScreen />;

      case 'profile':
        return <ProfileScreen />;

      case 'home':
      default:
        return (
          <ScrollView 
          style={styles.homeContainer}
          contentContainerStyle={styles.homeContent}
          showsVerticalScrollIndicator={false}
          >

            {/* ========================================
                TITLE
            ======================================== */}

            <Text style={styles.title}>
              Dashboard
            </Text>

            <Text style={styles.subtitle}>
              Selamat datang
              {nama ? `, ${nama}` : ''}!
            </Text>

            {/* ========================================
                CLOCK
            ======================================== */}

            <View style={styles.clockCard}>

              <Text style={styles.clock}>
                {currentTime.toLocaleTimeString(
                  'id-ID',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  }
                )}
              </Text>

              <Text style={styles.date}>
                {currentTime.toLocaleDateString(
                  'id-ID',
                  {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }
                )}
              </Text>

            </View>

            {/* ========================================
                JADWAL KERJA
            ======================================== */}

            <View style={styles.scheduleCard}>

              <Text style={styles.scheduleTitle}>
                Jadwal Hari Ini
              </Text>

              <Text style={styles.scheduleDay}>
                {dayName}
              </Text>

              {/* STATUS HARI */}

              <View style={styles.statusContainer}>

                <Text style={styles.statusLabel}>
                  Status
                </Text>

                <Text
                  style={[
                    styles.statusValue,
                    isHoliday
                      ? styles.holidayText
                      : styles.workText,
                  ]}
                >
                  {dayStatus}
                </Text>

              </View>

              {/* JADWAL MASUK */}

              {!isHoliday && (
                <View style={styles.scheduleRow}>

                  <View>
                    <Text style={styles.scheduleLabel}>
                      Jam Masuk
                    </Text>

                    <Text style={styles.scheduleTime}>
                      {schedule.masuk}
                    </Text>
                  </View>

                  <View style={styles.scheduleDivider} />

                  {/* JADWAL PULANG */}

                  <View>
                    <Text style={styles.scheduleLabel}>
                      Jam Pulang
                    </Text>

                    <Text style={styles.scheduleTime}>
                      {schedule.pulang}
                    </Text>
                  </View>

                </View>
              )}

            </View>

            {/* ========================================
                STATUS ABSENSI
            ======================================== */}

            {!isHoliday && (
              <>
                <AttendanceStatus />

                <AttendanceButton />

                <AttendanceOutButton />
              </>
            )}

            {/* ========================================
                PESAN HARI LIBUR
            ======================================== */}

            {isHoliday && (
              <View style={styles.holidayCard}>

                <Text style={styles.holidayTitle}>
                  Hari Libur
                </Text>

                <Text style={styles.holidayDescription}>
                  Tidak ada jadwal absensi hari ini.
                </Text>

              </View>
            )}

          </ScrollView>
        );
    }
  };

  // ========================================
  // MAIN RETURN
  // ========================================

  return (
    <View style={styles.container}>

      <View style={styles.content}>
        {renderScreen()}
      </View>

      <BottomNavbar
        activeTab={activeTab}
        onTabPress={setActiveTab}
      />

    </View>
  );
}

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  content: {
    flex: 1,
  },

  homeContainer: {
    flex: 1,
  },

  homeContent: {
  paddingHorizontal: 24,
  paddingTop: 40,
  paddingBottom: 30,
},

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 24,
  },

  // ========================================
  // CLOCK
  // ========================================

  clockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,

    elevation: 2,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  clock: {
    fontSize: 42,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 1,
  },

  date: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textTransform: 'capitalize',
  },

  // ========================================
  // SCHEDULE CARD
  // ========================================

  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,

    elevation: 2,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  scheduleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },

  scheduleDay: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    textTransform: 'capitalize',
  },

  // ========================================
  // STATUS
  // ========================================

  statusContainer: {
    marginBottom: 16,
  },

  statusLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },

  statusValue: {
    fontSize: 15,
    fontWeight: '700',
  },

  workText: {
    color: '#16A34A',
  },

  holidayText: {
    color: '#DC2626',
  },

  // ========================================
  // SCHEDULE ROW
  // ========================================

  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  scheduleLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },

  scheduleTime: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2563EB',
  },

  scheduleDivider: {
    width: 1,
    height: 45,
    backgroundColor: '#E2E8F0',
  },

  // ========================================
  // HOLIDAY CARD
  // ========================================

  holidayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,

    elevation: 2,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  holidayTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 6,
  },

  holidayDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },

});