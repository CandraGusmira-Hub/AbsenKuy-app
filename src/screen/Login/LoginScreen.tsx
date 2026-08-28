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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // ========================================
    // VALIDASI
    // ========================================

    if (!email.trim() || !password) {
      Alert.alert(
        'Login',
        'Email dan password wajib diisi.'
      );
      return;
    }

    try {
      setLoading(true);

      // ========================================
      // LOGIN KE SUPABASE AUTH
      // ========================================

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

      // ========================================
      // CEK ERROR LOGIN
      // ========================================

      if (error) {
        throw error;
      }

      // ========================================
      // CEK USER
      // ========================================

      if (!data.user) {
        throw new Error('User tidak ditemukan.');
      }

      console.log(
        'Login berhasil:',
        data.user
      );

      // ========================================
      // AMBIL DATA PROFILE
      // ========================================

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(`
          id,
          nama,
          username,
          email,
          role
        `)
        .eq('id', data.user.id)
        .single();

      // ========================================
      // CEK PROFILE
      // ========================================

      if (profileError) {
        console.error(
          'Gagal mengambil profile:',
          profileError
        );

        // Logout kembali karena profile
        // tidak berhasil ditemukan
        await supabase.auth.signOut();

        throw new Error(
          'Data profile pengguna tidak ditemukan.'
        );
      }

      if (!profile) {
        await supabase.auth.signOut();

        throw new Error(
          'Data profile pengguna tidak ditemukan.'
        );
      }

      console.log(
        'Profile berhasil:',
        profile
      );

      console.log(
        'Role pengguna:',
        profile.role
      );

      // ========================================
      // CEK ROLE
      // ========================================

      if (profile.role === 'admin') {
        // ======================================
        // ADMIN
        // ======================================

        console.log(
          'Login sebagai ADMIN'
        );

        router.replace('/admin/dashboard');

        return;
      }

      // ========================================
      // USER BIASA
      // ========================================

      console.log(
        'Login sebagai USER'
      );

      router.replace('/dashboard');

    } catch (error: any) {
      console.error(
        'Login error:',
        error
      );

      Alert.alert(
        'Login Gagal',
        error?.message ||
          'Email atau password salah.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View 
    style={styles.container}>

      <View style={styles.content}>


        {/* ========================================
            TITLE
        ======================================== */}

        <Text style={styles.title}>
          Selamat Datang di
        </Text>

        {/* ========================================
            LOGO
        ======================================== */}

        <Text style={styles.logo}>
          AbsenKuy
        </Text>

        <Text style={styles.subtitle}>
          Login untuk melanjutkan ke Absenkuy
        </Text>

        {/* ========================================
            EMAIL
        ======================================== */}

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
            autoCorrect={false}
            editable={!loading}
          />

        </View>

        {/* ========================================
            PASSWORD
        ======================================== */}

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
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

        </View>

        {/* ========================================
            LOGIN BUTTON
        ======================================== */}

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={({ pressed }) => [
            styles.loginButton,

            pressed &&
              !loading &&
              styles.loginButtonPressed,

            loading &&
              styles.loginButtonDisabled,
          ]}
        >

          <Text style={styles.loginText}>
            {loading
              ? 'Login...'
              : 'Login'}
          </Text>

        </Pressable>

        {/* ========================================
            REGISTER
        ======================================== */}

        <Pressable
          onPress={() =>
            router.replace('/register')
          }
          disabled={loading}
          style={styles.registerLink}
        >

          <Text style={styles.registerText}>
            Belum punya akun?{' '}

            <Text style={styles.registerTextBold}>
              Register
            </Text>
          </Text>

        </Pressable>

      </View>

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
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  logo: {
    fontSize: 30,
    fontWeight: '800',
    color: '#d20000',
    textAlign: 'center',
    marginBottom: 1,
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
    marginBottom: 28,
  },

  inputContainer: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 7,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
  },

  loginButton: {
    height: 52,
    backgroundColor: '#d20000',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  loginButtonPressed: {
    backgroundColor: '#630000',
    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  loginButtonDisabled: {
    opacity: 0.6,
  },

  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },

  registerText: {
    fontSize: 14,
    color: '#64748B',
  },

  registerTextBold: {
    color: '#0054d2',
    fontWeight: '700',
  },

});