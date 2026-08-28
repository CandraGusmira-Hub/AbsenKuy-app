import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { supabase } from '../../lib/supabase';

export default function RegisterScreen() {
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // ========================================
    // VALIDASI INPUT
    // ========================================

    if (
      !nama.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        'Register',
        'Semua field wajib diisi.'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Register',
        'Password minimal 6 karakter.'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Register',
        'Konfirmasi password tidak sama.'
      );
      return;
    }

    try {
      setLoading(true);

      // ========================================
      // REGISTER KE SUPABASE AUTH
      // ========================================

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,

        options: {
          data: {
            nama: nama.trim(),
            username: username.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      // ========================================
      // CEK HASIL REGISTER
      // ========================================

      if (!data.user) {
        throw new Error(
          'User gagal dibuat.'
        );
      }

      // ========================================
      // EMAIL CONFIRMATION
      // ========================================

      if (!data.session) {
        Alert.alert(
          'Register Berhasil',
          'Akun berhasil dibuat. Silakan cek email untuk melakukan verifikasi.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/login');
              },
            },
          ]
        );

        return;
      }

      // ========================================
      // JIKA SESSION LANGSUNG TERSEDIA
      // ========================================

      Alert.alert(
        'Register Berhasil',
        'Akun berhasil dibuat.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/login');
            },
          },
        ]
      );

    } catch (error: any) {
      console.error('Register error:', error);

      Alert.alert(
        'Register Gagal',
        error?.message || 'Terjadi kesalahan saat register.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>


        <Text style={styles.title}>
          Buat Akun
        </Text>

        <Text style={styles.logo}>
          AbsenKuy
        </Text>

        <Text style={styles.subtitle}>
          Daftar untuk menggunakan Absenkuy
        </Text>

        {/* NAMA */}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Nama
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Masukkan nama"
            placeholderTextColor="#94A3B8"
            value={nama}
            onChangeText={setNama}
          />
        </View>

        {/* USERNAME */}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Username
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Masukkan username"
            placeholderTextColor="#94A3B8"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        {/* EMAIL */}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Masukkan email"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* PASSWORD */}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Masukkan password"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* CONFIRM PASSWORD */}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Konfirmasi Password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ulangi password"
            placeholderTextColor="#94A3B8"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        {/* REGISTER BUTTON */}

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          style={({ pressed }) => [
            styles.registerButton,

            pressed && styles.registerButtonPressed,

            loading && styles.registerButtonDisabled,
          ]}
        >
          <Text style={styles.registerText}>
            {loading ? 'Mendaftarkan...' : 'Daftar'}
          </Text>
        </Pressable>

        {/* LOGIN */}

        <Pressable
          onPress={() => router.replace('/login')}
          disabled={loading}
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>
            Sudah punya akun?{' '}
            <Text style={styles.loginTextBold}>
              Login
            </Text>
          </Text>
        </Pressable>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  logo: {
    fontSize: 30,
    fontWeight: '800',
    color: '#d20000',
    textAlign: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 33,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 1,
  },

  subtitle: {
    fontSize: 15,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 24,
  },

  inputContainer: {
    marginBottom: 14,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 7,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
  },

  registerButton: {
    height: 52,
    backgroundColor: '#d20000',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },

  registerButtonPressed: {
    backgroundColor: '#630000',
    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  registerButtonDisabled: {
    opacity: 0.6,
  },

  registerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },

  loginText: {
    fontSize: 14,
    color: '#64748B',
  },

  loginTextBold: {
    color: '#2563EB',
    fontWeight: '700',
  },
});