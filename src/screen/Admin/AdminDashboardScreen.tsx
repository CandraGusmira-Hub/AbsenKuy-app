import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { supabase } from '../../lib/supabase';

type LeaveType = 'izin' | 'cuti';
type RequestStatus = 'pending' | 'approved' | 'rejected';

type Profile = {
  nama: string;
  username: string;
  email: string;
};

type LeaveRequest = {
  id: number;
  user_id: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  status: RequestStatus;
  created_at: string;
  profiles: Profile | null;
};

export default function AdminDashboardScreen() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ========================================
  // AMBIL DATA PENGAJUAN
  // ========================================

  const loadRequests = useCallback(async () => {
    try {
      console.log('====================================');
      console.log('ADMIN DASHBOARD - LOAD REQUESTS');
      console.log('====================================');

      // ========================================
      // 1. AMBIL DATA LEAVE REQUESTS
      // ========================================

      const {
        data: leaveRequests,
        error: leaveError,
      } = await supabase
        .from('leave_requests')
        .select(`
          id,
          user_id,
          type,
          start_date,
          end_date,
          reason,
          status,
          created_at
        `)
        .order('created_at', {
          ascending: false,
        });

      if (leaveError) {
        console.error(
          'ERROR LEAVE REQUESTS:',
          leaveError
        );

        Alert.alert(
          'Gagal',
          `Gagal mengambil data pengajuan.\n\n${leaveError.message}`
        );

        return;
      }

      console.log(
        'Jumlah pengajuan:',
        leaveRequests?.length ?? 0
      );

      // ========================================
      // JIKA BELUM ADA PENGAJUAN
      // ========================================

      if (!leaveRequests || leaveRequests.length === 0) {
        setRequests([]);
        return;
      }

      // ========================================
      // 2. AMBIL SEMUA USER ID
      // ========================================

      const userIds = [
        ...new Set(
          leaveRequests.map(
            (item) => item.user_id
          )
        ),
      ];

      console.log(
        'User ID:',
        userIds
      );

      // ========================================
      // 3. AMBIL DATA PROFILES
      // ========================================

      const {
        data: profiles,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(`
          id,
          nama,
          username,
          email
        `)
        .in('id', userIds);

      if (profileError) {
        console.error(
          'ERROR PROFILES:',
          profileError
        );

        Alert.alert(
          'Gagal',
          `Gagal mengambil data pengguna.\n\n${profileError.message}`
        );

        return;
      }

      console.log(
        'Jumlah profile:',
        profiles?.length ?? 0
      );

      // ========================================
      // 4. GABUNGKAN REQUEST + PROFILE
      // ========================================

      const formattedRequests: LeaveRequest[] =
        leaveRequests.map((request) => {
          const profile =
            profiles?.find(
              (item) =>
                item.id === request.user_id
            ) ?? null;

          return {
            id: request.id,
            user_id: request.user_id,
            type: request.type as LeaveType,
            start_date: request.start_date,
            end_date: request.end_date,
            reason: request.reason,
            status:
              request.status as RequestStatus,
            created_at: request.created_at,

            profiles: profile
              ? {
                  nama: profile.nama,
                  username: profile.username,
                  email: profile.email,
                }
              : null,
          };
        });

      // ========================================
      // 5. SIMPAN KE STATE
      // ========================================

      setRequests(formattedRequests);

      console.log(
        'Data dashboard berhasil dimuat:',
        formattedRequests
      );
    } catch (error) {
      console.error(
        'ERROR LOAD REQUESTS:',
        error
      );

      Alert.alert(
        'Error',
        'Terjadi kesalahan saat mengambil data pengajuan.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ========================================
  // LOAD SAAT DASHBOARD DIBUKA
  // ========================================

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // ========================================
  // REFRESH
  // ========================================

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  // ========================================
  // HITUNG STATISTIK
  // ========================================

  const pendingCount = requests.filter(
    (item) => item.status === 'pending'
  ).length;

  const approvedCount = requests.filter(
    (item) => item.status === 'approved'
  ).length;

  const rejectedCount = requests.filter(
    (item) => item.status === 'rejected'
  ).length;

  const totalCount = requests.length;

  // ========================================
  // FORMAT TIPE
  // ========================================

  const getTypeLabel = (
    type: LeaveType
  ) => {
    if (type === 'izin') {
      return 'Izin';
    }

    return 'Cuti';
  };

  // ========================================
  // FORMAT STATUS
  // ========================================

  const getStatusLabel = (
    status: RequestStatus
  ) => {
    if (status === 'pending') {
      return 'Menunggu';
    }

    if (status === 'approved') {
      return 'Disetujui';
    }

    return 'Ditolak';
  };

  // ========================================
  // FORMAT TANGGAL
  // ========================================

  const formatDate = (tanggal: string) => {
    return new Date(
      `${tanggal}T00:00:00`
    ).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // ========================================
  // DATA TERBARU
  // ========================================

  const recentRequests =
    requests.slice(0, 5);

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
          Memuat dashboard admin...
        </Text>
      </View>
    );
  }

  // ========================================
  // SCREEN
  // ========================================

  return (
    <View style={styles.container}>

      {/* ========================================
          HEADER
      ======================================== */}

      <View style={styles.header}>

        <View style={styles.headerLeft}>

          <Text style={styles.greeting}>
            Selamat Datang 👋
          </Text>

          <Text style={styles.title}>
            Dashboard Admin
          </Text>

        </View>

        <View style={styles.adminBadge}>

          <Text style={styles.adminBadgeText}>
            ADMIN
          </Text>

        </View>

      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >

        {/* ========================================
            STATISTIK
        ======================================== */}

        <Text style={styles.sectionTitle}>
          Ringkasan
        </Text>

        <View style={styles.statsContainer}>

          {/* PENDING */}

          <View style={styles.statCard}>

            <View
              style={[
                styles.statIcon,
                styles.pendingIcon,
              ]}
            >
              <Text style={styles.statIconText}>
                ⏳
              </Text>
            </View>

            <Text
              style={[
                styles.statNumber,
                styles.pendingNumber,
              ]}
            >
              {pendingCount}
            </Text>

            <Text style={styles.statLabel}>
              Pengajuan Pending
            </Text>

          </View>

          {/* APPROVED */}

          <View style={styles.statCard}>

            <View
              style={[
                styles.statIcon,
                styles.approvedIcon,
              ]}
            >
              <Text style={styles.statIconText}>
                ✓
              </Text>
            </View>

            <Text
              style={[
                styles.statNumber,
                styles.approvedNumber,
              ]}
            >
              {approvedCount}
            </Text>

            <Text style={styles.statLabel}>
              Disetujui
            </Text>

          </View>

          {/* REJECTED */}

          <View style={styles.statCard}>

            <View
              style={[
                styles.statIcon,
                styles.rejectedIcon,
              ]}
            >
              <Text style={styles.statIconText}>
                ✕
              </Text>
            </View>

            <Text
              style={[
                styles.statNumber,
                styles.rejectedNumber,
              ]}
            >
              {rejectedCount}
            </Text>

            <Text style={styles.statLabel}>
              Ditolak
            </Text>

          </View>

          {/* TOTAL */}

          <View style={styles.statCard}>

            <View
              style={[
                styles.statIcon,
                styles.totalIcon,
              ]}
            >
              <Text style={styles.statIconText}>
                📋
              </Text>
            </View>

            <Text
              style={[
                styles.statNumber,
                styles.totalNumber,
              ]}
            >
              {totalCount}
            </Text>

            <Text style={styles.statLabel}>
              Total Pengajuan
            </Text>

          </View>

        </View>

        {/* ========================================
            MENU ADMIN
        ======================================== */}

        <Text style={styles.sectionTitle}>
          Menu Admin
        </Text>

        {/* PENGAJUAN IZIN & CUTI */}

        <Pressable
          style={({ pressed }) => [
            styles.menuCard,
            pressed &&
              styles.menuCardPressed,
          ]}
          onPress={() =>
            router.push(
              '/admin/leave-requests'
            )
          }
        >

          <View style={styles.menuIcon}>
            <Text style={styles.menuIconText}>
              📋
            </Text>
          </View>

          <View style={styles.menuContent}>

            <View style={styles.menuTitleRow}>

              <Text style={styles.menuTitle}>
                Pengajuan Izin & Cuti
              </Text>

              {pendingCount > 0 && (
                <View
                  style={styles.pendingBadge}
                >
                  <Text
                    style={
                      styles.pendingBadgeText
                    }
                  >
                    {pendingCount}
                  </Text>
                </View>
              )}

            </View>

            <Text
              style={styles.menuDescription}
            >
              Lihat dan kelola pengajuan izin
              dan cuti karyawan.
            </Text>

          </View>

          <Text style={styles.arrow}>
            ›
          </Text>

        </Pressable>

        {/* DATA KARYAWAN */}

        <Pressable
          style={({ pressed }) => [
            styles.menuCard,
            pressed &&
              styles.menuCardPressed,
          ]}
          onPress={() => {
            Alert.alert(
              'Data Karyawan',
              'Menu Data Karyawan belum dibuat.'
            );
          }}
        >

          <View style={styles.menuIcon}>
            <Text style={styles.menuIconText}>
              👥
            </Text>
          </View>

          <View style={styles.menuContent}>

            <Text style={styles.menuTitle}>
              Data Karyawan
            </Text>

            <Text
              style={styles.menuDescription}
            >
              Lihat daftar pengguna dan
              informasi karyawan.
            </Text>

          </View>

          <Text style={styles.arrow}>
            ›
          </Text>

        </Pressable>

        {/* RIWAYAT ABSENSI */}

        <Pressable
            onPress={() => router.push('/admin/attendance')}
            style={({ pressed }) => [
                styles.menuCard,
                pressed && styles.menuCardPressed,
            ]}
            >
            <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>
                🕐
                </Text>
            </View>

            <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>
                Riwayat Absensi
                </Text>

                <Text style={styles.menuDescription}>
                Pantau data absensi seluruh karyawan.
                </Text>
            </View>

            <Text style={styles.arrow}>
                ›
            </Text>
        </Pressable>

        {/* ========================================
            PENGAJUAN TERBARU
        ======================================== */}

        <View style={styles.recentHeader}>

          <Text style={styles.sectionTitle}>
            Pengajuan Terbaru
          </Text>

          {requests.length > 0 && (
            <Pressable
              onPress={() =>
                router.push(
                  '/admin/leave-requests'
                )
              }
            >
              <Text style={styles.viewAll}>
                Lihat Semua
              </Text>
            </Pressable>
          )}

        </View>

        {/* EMPTY */}

        {recentRequests.length === 0 && (
          <View style={styles.emptyCard}>

            <Text style={styles.emptyIcon}>
              📭
            </Text>

            <Text style={styles.emptyTitle}>
              Belum ada pengajuan
            </Text>

            <Text style={styles.emptyText}>
              Pengajuan izin atau cuti terbaru
              akan muncul di sini.
            </Text>

          </View>
        )}

        {/* RECENT LIST */}

        {recentRequests.map(
          (request) => {

            const profile =
              request.profiles;

            return (
              <Pressable
                key={request.id}
                style={({ pressed }) => [
                  styles.recentCard,
                  pressed &&
                    styles.recentCardPressed,
                ]}
                onPress={() =>
                  router.push(
                    '/admin/leave-requests'
                  )
                }
              >

                {/* AVATAR */}

                <View
                  style={styles.recentAvatar}
                >
                  <Text
                    style={
                      styles.recentAvatarText
                    }
                  >
                    {profile?.nama
                      ? profile.nama
                          .charAt(0)
                          .toUpperCase()
                      : '?'}
                  </Text>
                </View>

                {/* CONTENT */}

                <View
                  style={styles.recentContent}
                >

                  <Text
                    style={
                      styles.recentUserName
                    }
                    numberOfLines={1}
                  >
                    {profile?.nama ||
                      'Nama tidak tersedia'}
                  </Text>

                  <Text
                    style={styles.recentType}
                  >
                    {getTypeLabel(
                      request.type
                    )}
                    {' • '}
                    {formatDate(
                      request.start_date
                    )}
                  </Text>

                  <Text
                    style={styles.recentReason}
                    numberOfLines={1}
                  >
                    {request.reason}
                  </Text>

                </View>

                {/* STATUS */}

                <View
                  style={[
                    styles.statusBadge,

                    request.status ===
                      'pending' &&
                      styles.statusPending,

                    request.status ===
                      'approved' &&
                      styles.statusApproved,

                    request.status ===
                      'rejected' &&
                      styles.statusRejected,
                  ]}
                >

                  <Text
                    style={[
                      styles.statusText,

                      request.status ===
                        'pending' &&
                        styles.statusPendingText,

                      request.status ===
                        'approved' &&
                        styles.statusApprovedText,

                      request.status ===
                        'rejected' &&
                        styles.statusRejectedText,
                    ]}
                  >
                    {getStatusLabel(
                      request.status
                    )}
                  </Text>

                </View>

              </Pressable>
            );
          }
        )}

      </ScrollView>

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

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },

  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  headerLeft: {
    flex: 1,
  },

  greeting: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },

  title: {
    fontSize: 25,
    fontWeight: '700',
    color: '#0F172A',
  },

  adminBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  adminBadgeText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    marginTop: 4,
  },

  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  statIconText: {
    fontSize: 18,
  },

  pendingIcon: {
    backgroundColor: '#FEF3C7',
  },

  approvedIcon: {
    backgroundColor: '#DCFCE7',
  },

  rejectedIcon: {
    backgroundColor: '#FEE2E2',
  },

  totalIcon: {
    backgroundColor: '#DBEAFE',
  },

  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 5,
  },

  pendingNumber: {
    color: '#F59E0B',
  },

  approvedNumber: {
    color: '#22C55E',
  },

  rejectedNumber: {
    color: '#EF4444',
  },

  totalNumber: {
    color: '#2563EB',
  },

  statLabel: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },

  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  menuCardPressed: {
    backgroundColor: '#F1F5F9',
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  menuIconText: {
    fontSize: 22,
  },

  menuContent: {
    flex: 1,
  },

  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },

  menuDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },

  pendingBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },

  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },

  arrow: {
    fontSize: 28,
    color: '#94A3B8',
    marginLeft: 8,
  },

  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  viewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 12,
  },

  recentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  recentCardPressed: {
    backgroundColor: '#F1F5F9',
  },

  recentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  recentAvatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2563EB',
  },

  recentContent: {
    flex: 1,
    marginRight: 8,
  },

  recentUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },

  recentType: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 3,
  },

  recentReason: {
    fontSize: 12,
    color: '#94A3B8',
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusPending: {
    backgroundColor: '#FEF3C7',
  },

  statusApproved: {
    backgroundColor: '#DCFCE7',
  },

  statusRejected: {
    backgroundColor: '#FEE2E2',
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  statusPendingText: {
    color: '#D97706',
  },

  statusApprovedText: {
    color: '#16A34A',
  },

  statusRejectedText: {
    color: '#DC2626',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  emptyIcon: {
    fontSize: 35,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
});