import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { supabase } from '../lib/supabase';

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);

      // ========================================
      // 1. CEK USER YANG SEDANG LOGIN
      // ========================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        Alert.alert(
          'Absen Pulang',
          'Anda belum login.'
        );
        return;
      }

      // ========================================
      // 2. AMBIL TANGGAL HARI INI
      // ========================================

      const today = new Date()
        .toISOString()
        .split('T')[0];

      // ========================================
      // 3. CARI ABSEN HARI INI
      // ========================================

      const { data: attendance, error: attendanceError } =
        await supabase
          .from('attendance')
          .select('id, jam_masuk, jam_pulang')
          .eq('user_id', user.id)
          .eq('tanggal', today)
          .maybeSingle();

      if (attendanceError) {
        throw attendanceError;
      }

      // ========================================
      // 4. BELUM ABSEN MASUK
      // ========================================

      if (!attendance) {
        Alert.alert(
          'Absen Pulang',
          'Anda belum melakukan absen masuk hari ini.'
        );
        return;
      }

      if (!attendance.jam_masuk) {
        Alert.alert(
          'Absen Pulang',
          'Anda belum melakukan absen masuk hari ini.'
        );
        return;
      }

      // ========================================
      // 5. SUDAH ABSEN PULANG
      // ========================================

      if (attendance.jam_pulang) {
        Alert.alert(
          'Absen Pulang',
          'Anda sudah melakukan absen pulang hari ini.'
        );
        return;
      }

      // ========================================
      // 6. UPDATE JAM PULANG
      // ========================================

      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          jam_pulang: now,
        })
        .eq('id', attendance.id)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // ========================================
      // 7. BERHASIL
      // ========================================

      Alert.alert(
        'Absen Pulang Berhasil',
        'Jam pulang berhasil dicatat.'
      );

    } catch (error: any) {
      console.error(
        'Gagal menyimpan absen pulang:',
        error
      );

      Alert.alert(
        'Absen Pulang Gagal',
        error?.message ||
          'Terjadi kesalahan saat menyimpan absen pulang.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        loading && styles.buttonDisabled,
      ]}
      onPress={handleCheckout}
      disabled={loading}
    >
      <Text style={styles.text}>
        {loading ? 'Memproses...' : 'Absen Pulang'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  buttonPressed: {
    backgroundColor: '#DC2626',
    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});