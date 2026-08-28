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

type LeaveRequest = {
  id: number;
  user_id: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  status: RequestStatus;
  created_at: string;

  profiles: {
    nama: string;
    username: string;
    email: string;
  } | null;
};

export default function AdminLeaveRequestsScreen() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // ========================================
  // AMBIL DATA PENGAJUAN
  // ========================================

  const loadRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          id,
          user_id,
          type,
          start_date,
          end_date,
          reason,
          status,
          created_at,
          profiles (
            nama,
            username,
            email
          )
        `)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        console.error(
          'Gagal mengambil pengajuan:',
          error
        );

        Alert.alert(
          'Gagal',
          'Gagal mengambil data pengajuan izin/cuti.'
        );

        return;
      }

      /*
       * Supabase terkadang mengembalikan relasi profiles
       * sebagai object atau array.
       *
       * Kita normalisasi di sini supaya aplikasi
       * selalu menggunakan object | null.
       */

      const formattedData: LeaveRequest[] = (data ?? []).map(
        (item: any) => {
          let profile = null;

          if (Array.isArray(item.profiles)) {
            profile = item.profiles[0] ?? null;
          } else if (item.profiles) {
            profile = item.profiles;
          }

          return {
            id: item.id,
            user_id: item.user_id,
            type: item.type,
            start_date: item.start_date,
            end_date: item.end_date,
            reason: item.reason,
            status: item.status,
            created_at: item.created_at,

            profiles: profile,
          };
        }
      );

      setRequests(formattedData);
    } catch (error) {
      console.error(
        'Error mengambil pengajuan:',
        error
      );

      Alert.alert(
        'Error',
        'Terjadi kesalahan saat mengambil data.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ========================================
  // LOAD SAAT SCREEN DIBUKA
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
  // UPDATE STATUS
  // ========================================

  const updateStatus = async (
    requestId: number,
    status: 'approved' | 'rejected'
  ) => {
    try {
      setProcessingId(requestId);

      const { error } = await supabase
        .from('leave_requests')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) {
        console.error(
          'Gagal update status:',
          error
        );

        Alert.alert(
          'Gagal',
          'Status pengajuan tidak berhasil diubah.'
        );

        return;
      }

      Alert.alert(
        'Berhasil',
        status === 'approved'
          ? 'Pengajuan berhasil disetujui.'
          : 'Pengajuan berhasil ditolak.'
      );

      await loadRequests();
    } catch (error) {
      console.error(
        'Error update status:',
        error
      );

      Alert.alert(
        'Error',
        'Terjadi kesalahan saat mengubah status.'
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ========================================
  // KONFIRMASI SETUJUI / TOLAK
  // ========================================

  const confirmUpdate = (
    requestId: number,
    type: LeaveType,
    status: 'approved' | 'rejected'
  ) => {
    const action =
      status === 'approved'
        ? 'menyetujui'
        : 'menolak';

    Alert.alert(
      status === 'approved'
        ? 'Setujui Pengajuan'
        : 'Tolak Pengajuan',

      `Apakah kamu yakin ingin ${action} pengajuan ${type}?`,

      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text:
            status === 'approved'
              ? 'Setujui'
              : 'Tolak',

          style:
            status === 'rejected'
              ? 'destructive'
              : 'default',

          onPress: () =>
            updateStatus(
              requestId,
              status
            ),
        },
      ]
    );
  };

  // ========================================
  // FORMAT TANGGAL
  // ========================================

  const formatDate = (date: string) => {
    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // ========================================
  // FORMAT TIPE
  // ========================================

  const getTypeLabel = (type: LeaveType) => {
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
  // JUMLAH STATUS
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
          Memuat pengajuan...
        </Text>
      </View>
    );
  }

  // ========================================
  // SCREEN
  // ========================================

  return (
    <View style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </Pressable>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Pengajuan Izin & Cuti
          </Text>

          <Text style={styles.headerSubtitle}>
            Kelola pengajuan karyawan
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

        {/* SUMMARY */}

        <View style={styles.summaryContainer}>

          <View style={styles.summaryCard}>
            <Text
              style={[
                styles.summaryNumber,
                styles.pendingNumber,
              ]}
            >
              {pendingCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Menunggu
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text
              style={[
                styles.summaryNumber,
                styles.approvedNumber,
              ]}
            >
              {approvedCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Disetujui
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text
              style={[
                styles.summaryNumber,
                styles.rejectedNumber,
              ]}
            >
              {rejectedCount}
            </Text>

            <Text style={styles.summaryLabel}>
              Ditolak
            </Text>
          </View>

        </View>

        {/* TITLE */}

        <Text style={styles.sectionTitle}>
          Semua Pengajuan
        </Text>

        {/* EMPTY */}

        {requests.length === 0 && (
          <View style={styles.emptyCard}>

            <Text style={styles.emptyIcon}>
              📭
            </Text>

            <Text style={styles.emptyTitle}>
              Belum ada pengajuan
            </Text>

            <Text style={styles.emptyText}>
              Pengajuan izin dan cuti karyawan
              akan muncul di sini.
            </Text>

          </View>
        )}

        {/* LIST */}

        {requests.map((request) => {

          const profile = request.profiles;

          return (
            <View
              key={request.id}
              style={styles.requestCard}
            >

              {/* USER */}

              <View style={styles.userRow}>

                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {profile?.nama
                      ? profile.nama
                          .charAt(0)
                          .toUpperCase()
                      : '?'}
                  </Text>
                </View>

                <View style={styles.userInfo}>

                  <Text style={styles.userName}>
                    {profile?.nama ||
                      'Nama tidak tersedia'}
                  </Text>

                  <Text style={styles.username}>
                    @{profile?.username || '-'}
                  </Text>

                </View>

                {/* STATUS */}

                <View
                  style={[
                    styles.statusBadge,

                    request.status === 'pending' &&
                      styles.pendingBadge,

                    request.status === 'approved' &&
                      styles.approvedBadge,

                    request.status === 'rejected' &&
                      styles.rejectedBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,

                      request.status === 'pending' &&
                        styles.pendingText,

                      request.status === 'approved' &&
                        styles.approvedText,

                      request.status === 'rejected' &&
                        styles.rejectedText,
                    ]}
                  >
                    {getStatusLabel(
                      request.status
                    )}
                  </Text>
                </View>

              </View>

              {/* TYPE */}

              <View style={styles.infoRow}>

                <Text style={styles.infoLabel}>
                  Jenis Pengajuan
                </Text>

                <Text style={styles.infoValue}>
                  {getTypeLabel(request.type)}
                </Text>

              </View>

              {/* DATE */}

              <View style={styles.infoRow}>

                <Text style={styles.infoLabel}>
                  Tanggal
                </Text>

                <Text style={styles.infoValue}>
                  {formatDate(
                    request.start_date
                  )}

                  {'  →  '}

                  {formatDate(
                    request.end_date
                  )}
                </Text>

              </View>

              {/* REASON */}

              <View style={styles.reasonContainer}>

                <Text style={styles.infoLabel}>
                  Alasan
                </Text>

                <Text style={styles.reasonText}>
                  {request.reason}
                </Text>

              </View>

              {/* ACTION */}

              {request.status === 'pending' && (
                <View style={styles.actionContainer}>

                  {/* TOLAK */}

                  <Pressable
                    style={({ pressed }) => [
                      styles.rejectButton,
                      pressed &&
                        styles.rejectButtonPressed,
                    ]}
                    disabled={
                      processingId === request.id
                    }
                    onPress={() =>
                      confirmUpdate(
                        request.id,
                        request.type,
                        'rejected'
                      )
                    }
                  >
                    {processingId === request.id ? (
                      <ActivityIndicator
                        color="#DC2626"
                      />
                    ) : (
                      <Text style={styles.rejectText}>
                        Tolak
                      </Text>
                    )}
                  </Pressable>

                  {/* SETUJUI */}

                  <Pressable
                    style={({ pressed }) => [
                      styles.approveButton,
                      pressed &&
                        styles.approveButtonPressed,
                    ]}
                    disabled={
                      processingId === request.id
                    }
                    onPress={() =>
                      confirmUpdate(
                        request.id,
                        request.type,
                        'approved'
                      )
                    }
                  >
                    {processingId === request.id ? (
                      <ActivityIndicator
                        color="#FFFFFF"
                      />
                    ) : (
                      <Text style={styles.approveText}>
                        Setujui
                      </Text>
                    )}
                  </Pressable>

                </View>
              )}

            </View>
          );
        })}

      </ScrollView>

    </View>
  );
}

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
    paddingTop: 55,
    paddingBottom: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },

  backText: {
    fontSize: 36,
    lineHeight: 40,
    color: '#0F172A',
  },

  headerContent: {
    flex: 1,
    marginLeft: 8,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },

  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 26,
  },

  summaryCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
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

  summaryNumber: {
    fontSize: 25,
    fontWeight: '700',
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

  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 5,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },

  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,

    elevation: 2,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },

  username: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },

  approvedBadge: {
    backgroundColor: '#DCFCE7',
  },

  rejectedBadge: {
    backgroundColor: '#FEE2E2',
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  pendingText: {
    color: '#D97706',
  },

  approvedText: {
    color: '#16A34A',
  },

  rejectedText: {
    color: '#DC2626',
  },

  infoRow: {
    marginBottom: 14,
  },

  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 5,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },

  reasonContainer: {
    marginBottom: 4,
  },

  reasonText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },

  actionContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  rejectButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rejectButtonPressed: {
    backgroundColor: '#FEF2F2',
  },

  rejectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },

  approveButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  approveButtonPressed: {
    backgroundColor: '#1D4ED8',
  },

  approveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyIcon: {
    fontSize: 38,
    marginBottom: 12,
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