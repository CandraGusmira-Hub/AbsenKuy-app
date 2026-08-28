import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import MapView, {
  Circle,
  Marker,
  PROVIDER_GOOGLE,
} from 'react-native-maps';

import * as Location from 'expo-location';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

// ========================================
// KONFIGURASI LOKASI ABSENSI
// ========================================

// GANTI dengan koordinat kantor/lokasi absensi kamu
const OFFICE_LOCATION = {
  latitude: 0.9269677245320207,
  longitude: 104.47099669747136,
};

// Radius maksimal untuk melakukan absensi
const ATTENDANCE_RADIUS = 100;

// ========================================
// TIPE LOKASI
// ========================================

type UserLocation = {
  latitude: number;
  longitude: number;
};

// ========================================
// SCREEN
// ========================================

export default function AttendanceFormScreen() {
  const [userLocation, setUserLocation] =
    useState<UserLocation | null>(null);

  const [distance, setDistance] = useState<number | null>(null);

  const [isAllowed, setIsAllowed] = useState(false);

  const [loading, setLoading] = useState(true);

  const [locationError, setLocationError] =
    useState<string | null>(null);

  // ========================================
  // AMBIL LOKASI USER
  // ========================================

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      setLoading(true);
      setLocationError(null);

      // ----------------------------------------
      // MINTA PERMISSION GPS
      // ----------------------------------------

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationError(
          'Izin lokasi diperlukan untuk melakukan absensi.'
        );

        setLoading(false);
        return;
      }

      // ----------------------------------------
      // CEK GPS AKTIF
      // ----------------------------------------

      const locationEnabled =
        await Location.hasServicesEnabledAsync();

      if (!locationEnabled) {
        setLocationError(
          'GPS perangkat kamu belum aktif.'
        );

        setLoading(false);
        return;
      }

      // ----------------------------------------
      // AMBIL POSISI USER
      // ----------------------------------------

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(currentLocation);

      // ----------------------------------------
      // HITUNG JARAK USER KE KANTOR
      // ----------------------------------------

      const calculatedDistance =
        calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          OFFICE_LOCATION.latitude,
          OFFICE_LOCATION.longitude
        );

      setDistance(calculatedDistance);

      // ----------------------------------------
      // CEK APAKAH BOLEH ABSEN
      // ----------------------------------------

      if (calculatedDistance <= ATTENDANCE_RADIUS) {
        setIsAllowed(true);
      } else {
        setIsAllowed(false);
      }

    } catch (error) {
      console.error(
        'Gagal mendapatkan lokasi:',
        error
      );

      setLocationError(
        'Gagal mendapatkan lokasi perangkat.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // HITUNG JARAK
  // ========================================

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const earthRadius = 6371000;

    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;

    const deltaLat =
      ((lat2 - lat1) * Math.PI) / 180;

    const deltaLon =
      ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) *
        Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c =
      2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return earthRadius * c;
  };

  // ========================================
  // FORMAT JARAK
  // ========================================

  const formatDistance = (
    distance: number
  ) => {
    if (distance < 1000) {
      return `${Math.round(distance)} meter`;
    }

    return `${(distance / 1000).toFixed(2)} km`;
  };

  // ========================================
  // KONFIRMASI ABSEN
  // ========================================

  const handleAttendance = async () => {
  try {
    // ========================================
    // CEK LOKASI USER
    // ========================================

    if (!userLocation) {
      Alert.alert(
        'Lokasi belum tersedia',
        'Tunggu sampai lokasi kamu berhasil didapatkan.'
      );
      return;
    }

    // ========================================
    // CEK RADIUS
    // ========================================

    if (!isAllowed) {
      Alert.alert(
        'Tidak dapat absen',
        `Kamu berada ${formatDistance(
          distance ?? 0
        )} dari lokasi absensi. Maksimal ${ATTENDANCE_RADIUS} meter.`
      );
      return;
    }

    // ========================================
    // AMBIL USER YANG SEDANG LOGIN
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
        'Belum Login',
        'Silakan login terlebih dahulu.'
      );
      return;
    }

    // ========================================
    // TANGGAL & WAKTU
    // ========================================

    const now = new Date();

    const tanggal = now
      .toISOString()
      .split('T')[0];

    const jamMasuk = now.toISOString();
        // ========================================
    // FORMAT LOKASI
    // ========================================

    const lokasi =
      `${userLocation.latitude},${userLocation.longitude}`;

    // ========================================
    // CEK APAKAH SUDAH ABSEN HARI INI
    // ========================================

    const { data: existingAttendance, error: checkError } =
      await supabase
        .from('attendance')
        .select('id')
        .eq('user_id', user.id)
        .eq('tanggal', tanggal)
        .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingAttendance) {
      Alert.alert(
        'Sudah Absen',
        'Kamu sudah melakukan absensi hari ini.'
      );
      return;
    }

    // ========================================
    // INSERT ABSENSI
    // ========================================

    const { data, error } = await supabase
      .from('attendance')
      .insert({
        user_id: user.id,
        tanggal: tanggal,
        jam_masuk: jamMasuk,
        jam_pulang: null,
        lokasi: lokasi,
        status: 'hadir',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // ========================================
    // BERHASIL
    // ========================================

    console.log(
      'Absensi berhasil disimpan:',
      data
    );

    Alert.alert(
      'Absensi Berhasil',
      `Absensi kamu berhasil dicatat.\n\nJam masuk: ${jamMasuk}`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );

  } catch (error: any) {
    console.error(
      'Gagal menyimpan absensi:',
      error
    );

    Alert.alert(
      'Absensi Gagal',
      error?.message ||
        'Terjadi kesalahan saat menyimpan absensi.'
    );
  }
};

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Mendapatkan lokasi kamu...
        </Text>
      </View>
    );
  }

  // ========================================
  // ERROR LOKASI
  // ========================================

  if (locationError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>
          Lokasi Tidak Tersedia
        </Text>

        <Text style={styles.errorText}>
          {locationError}
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={getUserLocation}
        >
          <Text style={styles.retryText}>
            Coba Lagi
          </Text>
        </Pressable>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            Kembali
          </Text>
        </Pressable>
      </View>
    );
  }

  // ========================================
  // MAIN UI
  // ========================================

  return (
    <View style={styles.container}>

      {/* ====================================
          HEADER
      ==================================== */}

      <View style={styles.header}>

        <Pressable
          onPress={() => router.back()}
          style={styles.backButtonHeader}
        >
          <Text style={styles.backIcon}>
            ‹
          </Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          Absensi
        </Text>

        <View style={styles.headerSpace} />

      </View>

      {/* ====================================
          MAP
      ==================================== */}

      {userLocation && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          showsUserLocation
          showsMyLocationButton
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >

          {/* LOKASI KANTOR */}

          <Marker
            coordinate={OFFICE_LOCATION}
            title="Lokasi Absensi"
            description="Lokasi kantor untuk melakukan absensi"
          />

          {/* RADIUS ABSENSI */}

          <Circle
            center={OFFICE_LOCATION}
            radius={ATTENDANCE_RADIUS}
            strokeWidth={2}
            fillColor="rgba(37, 99, 235, 0.15)"
            strokeColor="#2563EB"
          />

        </MapView>
      )}

      {/* ====================================
          INFORMATION PANEL
      ==================================== */}

      <View style={styles.panel}>

        <Text style={styles.title}>
          Konfirmasi Absensi
        </Text>

        <Text style={styles.subtitle}>
          Pastikan kamu berada di area yang
          diperbolehkan untuk melakukan absensi.
        </Text>

        {/* STATUS */}

        <View
          style={[
            styles.statusCard,
            isAllowed
              ? styles.allowedCard
              : styles.notAllowedCard,
          ]}
        >

          <Text style={styles.statusIcon}>
            {isAllowed ? '✓' : '✕'}
          </Text>

          <View style={styles.statusContent}>

            <Text style={styles.statusTitle}>
              {isAllowed
                ? 'Boleh Absen'
                : 'Tidak Bisa Absen'}
            </Text>

            <Text style={styles.statusDescription}>
              {distance !== null
                ? `Jarak kamu: ${formatDistance(
                    distance
                  )}`
                : 'Jarak belum diketahui'}
            </Text>

          </View>

        </View>

        {/* RADIUS INFO */}

        <View style={styles.infoRow}>

          <Text style={styles.infoLabel}>
            Radius absensi
          </Text>

          <Text style={styles.infoValue}>
            {ATTENDANCE_RADIUS} meter
          </Text>

        </View>

        {/* USER COORDINATE */}

        {userLocation && (
          <View style={styles.coordinateCard}>

            <Text style={styles.coordinateTitle}>
              Lokasi kamu
            </Text>

            <Text style={styles.coordinateText}>
              Latitude: {userLocation.latitude.toFixed(6)}
            </Text>

            <Text style={styles.coordinateText}>
              Longitude: {userLocation.longitude.toFixed(6)}
            </Text>

          </View>
        )}

        {/* ABSEN BUTTON */}

        <Pressable
          disabled={!isAllowed}
          onPress={handleAttendance}
          style={({ pressed }) => [
            styles.attendanceButton,

            !isAllowed &&
              styles.attendanceButtonDisabled,

            pressed &&
              isAllowed &&
              styles.attendanceButtonPressed,
          ]}
        >

          <Text
            style={[
              styles.attendanceButtonText,
              !isAllowed &&
                styles.attendanceButtonTextDisabled,
            ]}
          >
            {isAllowed
              ? 'Konfirmasi Absen'
              : 'Di Luar Area Absensi'}
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

  // ======================================
  // HEADER
  // ======================================

  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  backButtonHeader: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },

  backIcon: {
    fontSize: 34,
    color: '#0F172A',
    lineHeight: 38,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },

  headerSpace: {
    width: 40,
  },

  // ======================================
  // MAP
  // ======================================

  map: {
    width: '100%',
    height: 300,
  },

  // ======================================
  // PANEL
  // ======================================

  panel: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    marginBottom: 16,
  },

  // ======================================
  // STATUS
  // ======================================

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },

  allowedCard: {
    backgroundColor: '#DCFCE7',
  },

  notAllowedCard: {
    backgroundColor: '#FEE2E2',
  },

  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 24,
    fontWeight: '700',
    marginRight: 12,
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },

  statusDescription: {
    fontSize: 13,
    color: '#64748B',
  },

  // ======================================
  // INFO
  // ======================================

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  infoLabel: {
    fontSize: 14,
    color: '#64748B',
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },

  // ======================================
  // COORDINATE
  // ======================================

  coordinateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  coordinateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },

  coordinateText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },

  // ======================================
  // BUTTON
  // ======================================

  attendanceButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },

  attendanceButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },

  attendanceButtonPressed: {
    backgroundColor: '#1D4ED8',
    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  attendanceButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  attendanceButtonTextDisabled: {
    color: '#64748B',
  },

  // ======================================
  // LOADING
  // ======================================

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#64748B',
  },

  // ======================================
  // ERROR
  // ======================================

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#F8FAFC',
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },

  errorText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },

  retryButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  backButton: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '600',
  },
});