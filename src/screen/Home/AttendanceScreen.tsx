import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';

type Attendance = {
  id: number;
  user_id: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  lokasi: string | null;
  status: 'hadir' | 'terlambat' | 'izin' | 'sakit' | 'cuti' | 'alpha';
};

export default function AttendanceScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>(
    [],
  );

  const [loading, setLoading] = useState(true);

  // ========================================
  // AMBIL DATA ABSENSI USER
  // ========================================

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      // Ambil user yang sedang login
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          'Gagal mengambil user:',
          userError.message,
        );
        return;
      }

      if (!user) {
        console.log('User belum login');
        return;
      }

      // Ambil history absensi user
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          user_id,
          tanggal,
          jam_masuk,
          jam_pulang,
          lokasi,
          status
        `)
        .eq('user_id', user.id)
        .order('tanggal', {
          ascending: false,
        });

      if (error) {
        console.error(
          'Gagal mengambil history absensi:',
          error.message,
        );
        return;
      }

      setAttendanceHistory(data ?? []);
    } catch (error) {
      console.error(
        'Error fetch attendance:',
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // CALENDAR
  // ========================================

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  // Hari pertama pada bulan
  const firstDay = new Date(year, month, 1).getDay();

  // Jumlah hari pada bulan
  const totalDays = new Date(
    year,
    month + 1,
    0,
  ).getDate();

  // Senin = 0, Minggu = 6
  const startDay =
    firstDay === 0 ? 6 : firstDay - 1;

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      days.push(day);
    }

    return days;
  }, [startDay, totalDays]);

  // ========================================
  // NAVIGASI BULAN
  // ========================================

  const previousMonth = () => {
    setCurrentDate(
      new Date(year, month - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(year, month + 1, 1),
    );
  };

  // ========================================
  // TODAY
  // ========================================

  const today = new Date();

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // ========================================
  // CEK APAKAH SUDAH ABSEN PADA TANGGAL
  // ========================================

  const hasAttendance = (day: number) => {
    const monthNumber = String(month + 1).padStart(
      2,
      '0',
    );

    const dayNumber = String(day).padStart(2, '0');

    const dateString = `${year}-${monthNumber}-${dayNumber}`;

    return attendanceHistory.some(
      (item) => item.tanggal === dateString,
    );
  };

  // ========================================
  // FORMAT JAM
  // ========================================

  const formatTime = (time: string | null) => {
    if (!time) {
      return '-';
    }

    const date = new Date(time);

    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ========================================
  // FORMAT TANGGAL
  // ========================================

  const formatDate = (date: string) => {
    const [year, month, day] = date.split('-');

    const localDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    );

    return localDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // ========================================
  // STATUS STYLE
  // ========================================

  const getStatusStyle = (
    status: Attendance['status'],
  ) => {
    switch (status) {
      case 'hadir':
        return styles.statusHadir;

      case 'terlambat':
        return styles.statusTerlambat;

      case 'izin':
        return styles.statusIzin;

      case 'sakit':
        return styles.statusSakit;

      case 'cuti':
        return styles.statusCuti;

      case 'alpha':
        return styles.statusAlpha;

      default:
        return styles.statusDefault;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ========================================
          HEADER
      ======================================== */}

      <Text style={styles.title}>
        Absensi
      </Text>

      <Text style={styles.subtitle}>
        Lihat dan kelola riwayat kehadiran kamu
      </Text>

      {/* ========================================
          CALENDAR
      ======================================== */}

      <View style={styles.calendar}>

        {/* MONTH HEADER */}

        <View style={styles.monthHeader}>
          <Pressable
            style={styles.arrowButton}
            onPress={previousMonth}
          >
            <Text style={styles.arrow}>
              ‹
            </Text>
          </Pressable>

          <Text style={styles.monthTitle}>
            {monthName}
          </Text>

          <Pressable
            style={styles.arrowButton}
            onPress={nextMonth}
          >
            <Text style={styles.arrow}>
              ›
            </Text>
          </Pressable>
        </View>

        {/* DAY NAME */}

        <View style={styles.weekRow}>
          {[
            'Sen',
            'Sel',
            'Rab',
            'Kam',
            'Jum',
            'Sab',
            'Min',
          ].map((day) => (
            <View
              key={day}
              style={styles.weekDay}
            >
              <Text style={styles.weekDayText}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* CALENDAR DAYS */}

        <View style={styles.daysContainer}>
          {calendarDays.map((day, index) => {
            if (day === null) {
              return (
                <View
                  key={`empty-${index}`}
                  style={styles.day}
                />
              );
            }

            const attended = hasAttendance(day);

            return (
              <Pressable
                key={day}
                style={[
                  styles.day,
                  isToday(day) && styles.today,
                ]}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isToday(day) &&
                      styles.todayCircle,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday(day) &&
                        styles.todayText,
                    ]}
                  >
                    {day}
                  </Text>
                </View>

                {/* TITIK ABSEN */}

                {attended && (
                  <View
                    style={styles.attendanceDot}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* LEGEND */}

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                styles.presentDot,
              ]}
            />

            <Text style={styles.legendText}>
              Hadir
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                styles.permissionDot,
              ]}
            />

            <Text style={styles.legendText}>
              Izin
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                styles.absentDot,
              ]}
            />

            <Text style={styles.legendText}>
              Tidak Hadir
            </Text>
          </View>
        </View>
      </View>

      {/* ========================================
          HISTORY ABSENSI
      ======================================== */}

      <View style={styles.historyContainer}>

        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>
            Riwayat Absensi
          </Text>

          <Pressable
            onPress={fetchAttendance}
          >
            <Text style={styles.refreshText}>
              Refresh
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="small"
            />

            <Text style={styles.loadingText}>
              Memuat riwayat...
            </Text>
          </View>
        ) : attendanceHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              Belum ada absensi
            </Text>

            <Text style={styles.emptyText}>
              Riwayat absensi kamu akan muncul di
              sini.
            </Text>
          </View>
        ) : (
          attendanceHistory.map((item) => (
            <View
              key={item.id}
              style={styles.historyCard}
            >

              {/* TANGGAL */}

              <View style={styles.historyTop}>
                <View>
                  <Text style={styles.historyDate}>
                    {formatDate(item.tanggal)}
                  </Text>

                  <Text
                    style={styles.historyLocation}
                    numberOfLines={1}
                  >
                    📍 {item.lokasi ?? '-'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    getStatusStyle(item.status),
                  ]}
                >
                  <Text
                    style={styles.statusText}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* JAM */}

              <View style={styles.timeRow}>

                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>
                    Masuk
                  </Text>

                  <Text style={styles.timeValue}>
                    {formatTime(
                      item.jam_masuk,
                    )}
                  </Text>
                </View>

                <View style={styles.timeDivider} />

                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>
                    Pulang
                  </Text>

                  <Text style={styles.timeValue}>
                    {formatTime(
                      item.jam_pulang,
                    )}
                  </Text>
                </View>

              </View>

            </View>
          ))
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },

  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5,
    marginBottom: 20,
  },

  // ========================================
  // CALENDAR
  // ========================================

  calendar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,

    elevation: 2,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textTransform: 'capitalize',
  },

  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrow: {
    fontSize: 28,
    color: '#2563EB',
    lineHeight: 30,
  },

  weekRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },

  weekDay: {
    flex: 1,
    alignItems: 'center',
  },

  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  day: {
    width: '14.2857%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dayText: {
    fontSize: 14,
    color: '#334155',
  },

  today: {
    width: '14.2857%',
  },

  todayCircle: {
    backgroundColor: '#2563EB',
  },

  todayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  attendanceDot: {
    position: 'absolute',
    bottom: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  presentDot: {
    backgroundColor: '#22C55E',
  },

  permissionDot: {
    backgroundColor: '#F59E0B',
  },

  absentDot: {
    backgroundColor: '#EF4444',
  },

  legendText: {
    fontSize: 12,
    color: '#64748B',
  },

  // ========================================
  // HISTORY
  // ========================================

  historyContainer: {
    marginTop: 24,
    paddingBottom: 30,
  },

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  historyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },

  refreshText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },

  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748B',
  },

  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

  emptyText: {
    marginTop: 5,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },

  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,

    elevation: 2,

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,

    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  historyDate: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    textTransform: 'capitalize',
    maxWidth: '70%',
  },

  historyLocation: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 5,
    maxWidth: 220,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  statusHadir: {
    backgroundColor: '#DCFCE7',
  },

  statusTerlambat: {
    backgroundColor: '#FEF3C7',
  },

  statusIzin: {
    backgroundColor: '#FEF3C7',
  },

  statusSakit: {
    backgroundColor: '#FEE2E2',
  },

  statusCuti: {
    backgroundColor: '#DBEAFE',
  },

  statusAlpha: {
    backgroundColor: '#FEE2E2',
  },

  statusDefault: {
    backgroundColor: '#E2E8F0',
  },

  timeRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  timeItem: {
    flex: 1,
  },

  timeDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },

  timeLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 3,
  },

  timeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
});