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

type Attendance = {
  id: number;
  user_id: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  status: string | null;
  created_at?: string;
};

type Profile = {
  id: string;
  nama: string;
  username: string;
  email: string;
};

type AttendanceWithProfile = Attendance & {
  profile: Profile | null;
};

export default function AdminAttendanceScreen() {
  const [attendance, setAttendance] = useState<
    AttendanceWithProfile[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  // ========================================
  // AMBIL DATA ABSENSI
  // ========================================

  const loadAttendance = useCallback(
    async () => {
      try {
        // ====================================
        // AMBIL SEMUA DATA ATTENDANCE
        // ====================================

        const {
          data: attendanceData,
          error: attendanceError,
        } = await supabase
          .from('attendance')
          .select(`
            id,
            user_id,
            tanggal,
            jam_masuk,
            jam_pulang,
            status,
            created_at
          `)
          .order('tanggal', {
            ascending: false,
          })
          .order('jam_masuk', {
            ascending: false,
          });

        // ====================================
        // CEK ERROR ATTENDANCE
        // ====================================

        if (attendanceError) {
          console.error(
            'Gagal mengambil absensi:',
            attendanceError
          );

          Alert.alert(
            'Gagal',
            'Gagal mengambil data riwayat absensi.'
          );

          return;
        }

        // ====================================
        // JIKA TIDAK ADA DATA
        // ====================================

        if (
          !attendanceData ||
          attendanceData.length === 0
        ) {
          setAttendance([]);
          return;
        }

        // ====================================
        // AMBIL USER ID
        // ====================================

        const userIds = [
          ...new Set(
            attendanceData.map(
              (item) => item.user_id
            )
          ),
        ];

        // ====================================
        // AMBIL PROFILE USER
        // ====================================

        const {
          data: profilesData,
          error: profilesError,
        } = await supabase
          .from('profiles')
          .select(`
            id,
            nama,
            username,
            email
          `)
          .in('id', userIds);

        if (profilesError) {
          console.error(
            'Gagal mengambil profile:',
            profilesError
          );

          Alert.alert(
            'Gagal',
            'Data absensi berhasil diambil, tetapi data pengguna gagal diambil.'
          );

          // Tetap tampilkan data absensi
          // walaupun profile gagal
          setAttendance(
            attendanceData.map(
              (item) => ({
                ...item,
                profile: null,
              })
            )
          );

          return;
        }

        // ====================================
        // GABUNGKAN ATTENDANCE + PROFILE
        // ====================================

        const combinedData: AttendanceWithProfile[] =
          attendanceData.map((item) => {
            const profile =
              profilesData?.find(
                (user) =>
                  user.id === item.user_id
              ) || null;

            return {
              ...item,
              profile,
            };
          });

        // ====================================
        // SIMPAN DATA
        // ====================================

        setAttendance(combinedData);
      } catch (error) {
        console.error(
          'Error mengambil absensi:',
          error
        );

        Alert.alert(
          'Error',
          'Terjadi kesalahan saat mengambil data absensi.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // ========================================
  // LOAD SAAT SCREEN DIBUKA
  // ========================================

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // ========================================
  // REFRESH
  // ========================================

  const handleRefresh = () => {
    setRefreshing(true);
    loadAttendance();
  };

  // ========================================
  // FORMAT TANGGAL
  // ========================================

  const formatDate = (
    date: string
  ) => {
    if (!date) {
      return '-';
    }

    try {
      return new Date(
        `${date}T00:00:00`
      ).toLocaleDateString(
        'id-ID',
        {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }
      );
    } catch {
      return date;
    }
  };

  // ========================================
  // FORMAT JAM
  // ========================================

  const formatTime = (
    time: string | null
  ) => {
    if (!time) {
      return '-';
    }

    try {
      const date = new Date(time);

      if (Number.isNaN(date.getTime())) {
        return time.substring(0, 5);
      }

      return date.toLocaleTimeString(
        'id-ID',
        {
          hour: '2-digit',
          minute: '2-digit',
        }
      );
    } catch {
      return time;
    }
  };

  // ========================================
  // STATUS LABEL
  // ========================================

  const getStatusLabel = (
    status: string | null
  ) => {
    if (!status) {
      return 'Tidak diketahui';
    }

    const normalized =
      status.toLowerCase();

    if (
      normalized === 'hadir' ||
      normalized === 'present'
    ) {
      return 'Hadir';
    }

    if (
      normalized === 'terlambat' ||
      normalized === 'late'
    ) {
      return 'Terlambat';
    }

    if (
      normalized === 'izin'
    ) {
      return 'Izin';
    }

    if (
      normalized === 'cuti'
    ) {
      return 'Cuti';
    }

    return status;
  };

  // ========================================
  // STATUS STYLE
  // ========================================

  const getStatusStyle = (
    status: string | null
  ) => {
    if (!status) {
      return {
        badge: styles.unknownBadge,
        text: styles.unknownText,
      };
    }

    const normalized =
      status.toLowerCase();

    if (
      normalized === 'hadir' ||
      normalized === 'present'
    ) {
      return {
        badge: styles.presentBadge,
        text: styles.presentText,
      };
    }

    if (
      normalized === 'terlambat' ||
      normalized === 'late'
    ) {
      return {
        badge: styles.lateBadge,
        text: styles.lateText,
      };
    }

    return {
      badge: styles.unknownBadge,
      text: styles.unknownText,
    };
  };

  // ========================================
  // JUMLAH DATA
  // ========================================

  const totalAttendance =
    attendance.length;

  const totalCheckedIn =
    attendance.filter(
      (item) =>
        item.jam_masuk !== null
    ).length;

  const totalCheckedOut =
    attendance.filter(
      (item) =>
        item.jam_pulang !== null
    ).length;

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text
          style={styles.loadingText}
        >
          Memuat riwayat absensi...
        </Text>
      </View>
    );
  }

  // ========================================
  // SCREEN
  // ========================================

  return (
    <View style={styles.container}>

      {/* ====================================
          HEADER
      ==================================== */}

      <View style={styles.header}>

        <Pressable
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={styles.backText}
          >
            ‹
          </Text>
        </Pressable>

        <View
          style={styles.headerContent}
        >
          <Text
            style={styles.headerTitle}
          >
            Riwayat Absensi
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Pantau absensi seluruh karyawan
          </Text>
        </View>

      </View>

      {/* ====================================
          CONTENT
      ==================================== */}

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={
              handleRefresh
            }
          />
        }
      >

        {/* ==================================
            SUMMARY
        ================================== */}

        <View
          style={
            styles.summaryContainer
          }
        >

          {/* TOTAL */}

          <View
            style={styles.summaryCard}
          >
            <Text
              style={
                styles.summaryNumber
              }
            >
              {totalAttendance}
            </Text>

            <Text
              style={
                styles.summaryLabel
              }
            >
              Total Absensi
            </Text>
          </View>

          {/* CHECK IN */}

          <View
            style={styles.summaryCard}
          >
            <Text
              style={[
                styles.summaryNumber,
                styles.checkInNumber,
              ]}
            >
              {totalCheckedIn}
            </Text>

            <Text
              style={
                styles.summaryLabel
              }
            >
              Sudah Masuk
            </Text>
          </View>

          {/* CHECK OUT */}

          <View
            style={styles.summaryCard}
          >
            <Text
              style={[
                styles.summaryNumber,
                styles.checkOutNumber,
              ]}
            >
              {totalCheckedOut}
            </Text>

            <Text
              style={
                styles.summaryLabel
              }
            >
              Sudah Pulang
            </Text>
          </View>

        </View>

        {/* ==================================
            TITLE
        ================================== */}

        <Text
          style={styles.sectionTitle}
        >
          Semua Riwayat Absensi
        </Text>

        {/* ==================================
            EMPTY
        ================================== */}

        {attendance.length === 0 && (
          <View
            style={styles.emptyCard}
          >

            <Text
              style={styles.emptyIcon}
            >
              🕐
            </Text>

            <Text
              style={
                styles.emptyTitle
              }
            >
              Belum ada data absensi
            </Text>

            <Text
              style={styles.emptyText}
            >
              Riwayat absensi karyawan
              akan muncul di sini.
            </Text>

          </View>
        )}

        {/* ==================================
            LIST ABSENSI
        ================================== */}

        {attendance.map(
          (item) => {

            const profile =
              item.profile;

            const statusStyle =
              getStatusStyle(
                item.status
              );

            return (
              <View
                key={item.id}
                style={
                  styles.attendanceCard
                }
              >

                {/* USER */}

                <View
                  style={
                    styles.userRow
                  }
                >

                  {/* AVATAR */}

                  <View
                    style={styles.avatar}
                  >
                    <Text
                      style={
                        styles.avatarText
                      }
                    >
                      {profile?.nama
                        ? profile.nama
                            .charAt(0)
                            .toUpperCase()
                        : '?'}
                    </Text>
                  </View>

                  {/* USER INFO */}

                  <View
                    style={
                      styles.userInfo
                    }
                  >

                    <Text
                      style={
                        styles.userName
                      }
                    >
                      {profile?.nama ||
                        'Nama tidak tersedia'}
                    </Text>

                    <Text
                      style={
                        styles.username
                      }
                    >
                      @{profile?.username ||
                        '-'}
                    </Text>

                  </View>

                  {/* STATUS */}

                  <View
                    style={[
                      styles.statusBadge,
                      statusStyle.badge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        statusStyle.text,
                      ]}
                    >
                      {getStatusLabel(
                        item.status
                      )}
                    </Text>
                  </View>

                </View>

                {/* DATE */}

                <View
                  style={
                    styles.dateContainer
                  }
                >
                  <Text
                    style={
                      styles.dateLabel
                    }
                  >
                    Tanggal
                  </Text>

                  <Text
                    style={
                      styles.dateValue
                    }
                  >
                    {formatDate(
                      item.tanggal
                    )}
                  </Text>
                </View>

                {/* TIME */}

                <View
                  style={
                    styles.timeContainer
                  }
                >

                  {/* CHECK IN */}

                  <View
                    style={
                      styles.timeBox
                    }
                  >
                    <Text
                      style={
                        styles.timeLabel
                      }
                    >
                      🟢 Jam Masuk
                    </Text>

                    <Text
                      style={
                        styles.timeValue
                      }
                    >
                      {formatTime(
                        item.jam_masuk
                      )}
                    </Text>
                  </View>

                  {/* CHECK OUT */}

                  <View
                    style={
                      styles.timeBox
                    }
                  >
                    <Text
                      style={
                        styles.timeLabel
                      }
                    >
                      🔴 Jam Pulang
                    </Text>

                    <Text
                      style={
                        styles.timeValue
                      }
                    >
                      {formatTime(
                        item.jam_pulang
                      )}
                    </Text>
                  </View>

                </View>

              </View>
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

  // ======================================
  // HEADER
  // ======================================

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

  // ======================================
  // CONTENT
  // ======================================

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // ======================================
  // SUMMARY
  // ======================================

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
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
  },

  checkInNumber: {
    color: '#16A34A',
  },

  checkOutNumber: {
    color: '#DC2626',
  },

  summaryLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 5,
    textAlign: 'center',
  },

  // ======================================
  // SECTION
  // ======================================

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },

  // ======================================
  // ATTENDANCE CARD
  // ======================================

  attendanceCard: {
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

  // ======================================
  // USER
  // ======================================

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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

  // ======================================
  // STATUS
  // ======================================

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  presentBadge: {
    backgroundColor: '#DCFCE7',
  },

  presentText: {
    color: '#16A34A',
  },

  lateBadge: {
    backgroundColor: '#FEF3C7',
  },

  lateText: {
    color: '#D97706',
  },

  unknownBadge: {
    backgroundColor: '#E2E8F0',
  },

  unknownText: {
    color: '#64748B',
  },

  // ======================================
  // DATE
  // ======================================

  dateContainer: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginBottom: 14,
  },

  dateLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },

  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },

  // ======================================
  // TIME
  // ======================================

  timeContainer: {
    flexDirection: 'row',
    gap: 10,
  },

  timeBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },

  timeLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 5,
  },

  timeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

  // ======================================
  // EMPTY
  // ======================================

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 35,

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