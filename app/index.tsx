import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';


export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>AbsenKuy</Text>

        <Text style={styles.title}>
          Kelola Absensi dengan Mudah
        </Text>

        <Text style={styles.description}>
          Pantau kehadiran, absensi, dan aktivitasmu
          dengan lebih praktis.
        </Text>

        <Link href="/login" asChild>
          <Pressable style={styles.loginButton}>
            <Text style={styles.loginText}>Login</Text>
          </Pressable>
        </Link>

        <Link href="/register" asChild>
          <Pressable style={styles.registerButton}>
            <Text style={styles.loginText}>Register</Text>
          </Pressable>
        </Link>

      </View>

      <Text style={styles.footer}>
        © 2026 Absenkuy
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
  },

  logo: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 1,
    color: '#d20000',
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    marginBottom: 16,
    textAlign: 'center',
  },

  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#0F172A',
    marginBottom: 32,
    textAlign: 'center',
  },

    loginButton: {
    height: 52,
    backgroundColor: '#d20000',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

    registerButton: {
    height: 52,
    backgroundColor: '#d20000',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

    loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  footer: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
  },
});