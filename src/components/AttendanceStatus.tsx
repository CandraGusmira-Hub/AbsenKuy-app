import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type AttendanceData = {
  jam_masuk: string | null;
  jam_pulang: string | null;
  status: string | null;
};

export default function AttendanceStatus() {
  const [attendance, setAttendance] =
    useState<AttendanceData | null>(null);

  const [loading, setLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);

      // ========================================
      // 1. CEK USER LOGIN
      // ========================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setAttendance(null);
        return;
      }

      // ========================================
      // 2. TANGGAL HARI INI
      // ========================================

      const today = new Date()
        .toISOString()
        .split('T')[0];

      // ========================================
      // 3. AMBIL ABSENSI HARI INI
      // ========================================

      const { data, error } = await supabase
        .from('attendance')
        .select('jam_masuk, jam_pulang, status')
        .eq('user_id', user.id)
        .eq('tanggal', today)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setAttendance(data);
    } catch (error: any) {
      console.error(
        'Gagal mengambil status absensi:',
        error
      );

      setAttendance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ========================================
  // LOAD SAAT COMPONENT DIBUKA
  // ========================================

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" />

        <Text style={styles.loadingText}>
          Mengecek status absensi...
        </Text>
      </View>
    );
  }

  // ========================================
  // BELUM ABSEN
  // ========================================

  if (!attendance) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Status Absensi Hari Ini
        </Text>

        <View style={styles.statusRow}>
          <View style={[styles.dot, styles.redDot]} />

          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              Belum Absen
            </Text>

            <Text style={styles.statusDescription}>
              Anda belum melakukan absen masuk hari ini.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ========================================
  // SUDAH ABSEN MASUK
  // ========================================

  if (attendance.jam_masuk && !attendance.jam_pulang) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Status Absensi Hari Ini
        </Text>

        <View style={styles.statusRow}>
          <View style={[styles.dot, styles.greenDot]} />

          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              Sudah Absen Masuk
            </Text>

            <Text style={styles.statusDescription}>
              Jam masuk: {formatTime(attendance.jam_masuk)}
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.dot, styles.orangeDot]} />

          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              Belum Absen Pulang
            </Text>

            <Text style={styles.statusDescription}>
              Jangan lupa melakukan absen pulang.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ========================================
  // ABSEN SUDAH LENGKAP
  // ========================================

  if (attendance.jam_masuk && attendance.jam_pulang) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Status Absensi Hari Ini
        </Text>

        <View style={styles.statusRow}>
          <View style={[styles.dot, styles.greenDot]} />

          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              Absen Masuk
            </Text>

            <Text style={styles.statusDescription}>
              {formatTime(attendance.jam_masuk)}
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.dot, styles.greenDot]} />

          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              Absen Pulang
            </Text>

            <Text style={styles.statusDescription}>
              {formatTime(attendance.jam_pulang)}
            </Text>
          </View>
        </View>

        <View style={styles.completeBox}>
          <Text style={styles.completeText}>
            ✓ Absensi hari ini sudah lengkap
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

// ========================================
// FORMAT JAM
// ========================================

function formatTime(value: string) {
  const date = new Date(value);

  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
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

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: 10,
  },

  redDot: {
    backgroundColor: '#EF4444',
  },

  greenDot: {
    backgroundColor: '#22C55E',
  },

  orangeDot: {
    backgroundColor: '#F59E0B',
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },

  statusDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },

  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748B',
  },

  completeBox: {
    marginTop: 4,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
  },

  completeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
    textAlign: 'center',
  },
});