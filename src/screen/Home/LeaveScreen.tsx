import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { supabase } from '../../lib/supabase';

type LeaveType = 'izin' | 'cuti';

type LeaveStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

type LeaveRequest = {
  id: number;
  user_id: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
  created_at: string;
  updated_at: string;
};

export default function LeaveScreen() {
  const [activeTab, setActiveTab] = useState('leave');
  // ========================================
  // USER
  // ========================================

  const [userId, setUserId] = useState<string | null>(null);

  // ========================================
  // FORM
  // ========================================

  const [type, setType] =
    useState<LeaveType>('izin');

  const [startDate, setStartDate] =
    useState<Date | null>(null);

  const [endDate, setEndDate] =
    useState<Date | null>(null);

  const [reason, setReason] =
    useState('');

  // ========================================
  // DATE PICKER
  // ========================================

  const [showStartPicker, setShowStartPicker] =
    useState(false);

  const [showEndPicker, setShowEndPicker] =
    useState(false);

  // ========================================
  // DATA
  // ========================================

  const [requests, setRequests] =
    useState<LeaveRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  // ========================================
  // LOAD DATA
  // ========================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
          userError.message
        );
        return;
      }

      if (!user) {
        Alert.alert(
          'Login',
          'User belum login.'
        );
        return;
      }

      setUserId(user.id);

      // Ambil riwayat pengajuan user
      const {
        data,
        error,
      } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        console.error(
          'Gagal mengambil riwayat:',
          error
        );

        Alert.alert(
          'Error',
          'Gagal mengambil riwayat pengajuan.'
        );

        return;
      }

      setRequests(
        (data || []) as LeaveRequest[]
      );
    } catch (error) {
      console.error(
        'Load data error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // FORMAT DATE -> YYYY-MM-DD
  // Untuk database PostgreSQL DATE
  // ========================================

  const formatDateForDatabase = (
    date: Date
  ) => {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // ========================================
  // FORMAT DATE UNTUK TAMPILAN
  // ========================================

  const formatDisplayDate = (
    date: Date | null
  ) => {
    if (!date) {
      return 'Pilih tanggal';
    }

    return date.toLocaleDateString(
      'id-ID',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    );
  };

  // ========================================
  // FORMAT DATE DARI DATABASE
  // ========================================

  const formatDatabaseDate = (
    date: string
  ) => {
    const [year, month, day] =
      date.split('-').map(Number);

    const parsedDate = new Date(
      year,
      month - 1,
      day
    );

    return parsedDate.toLocaleDateString(
      'id-ID',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    );
  };

  // ========================================
  // PILIH TANGGAL MULAI
  // ========================================

  const handleStartDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowStartPicker(false);

    if (
      event.type === 'set' &&
      selectedDate
    ) {
      setStartDate(selectedDate);

      // Kalau tanggal selesai belum ada,
      // otomatis gunakan tanggal mulai
      if (!endDate) {
        setEndDate(selectedDate);
      }

      // Kalau tanggal selesai lebih kecil
      // dari tanggal mulai, sesuaikan
      if (
        endDate &&
        selectedDate > endDate
      ) {
        setEndDate(selectedDate);
      }
    }
  };

  // ========================================
  // PILIH TANGGAL SELESAI
  // ========================================

  const handleEndDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowEndPicker(false);

    if (
      event.type === 'set' &&
      selectedDate
    ) {
      if (
        startDate &&
        selectedDate < startDate
      ) {
        Alert.alert(
          'Tanggal tidak valid',
          'Tanggal selesai tidak boleh sebelum tanggal mulai.'
        );
        return;
      }

      setEndDate(selectedDate);
    }
  };

  // ========================================
  // SUBMIT
  // ========================================

  const handleSubmit = async () => {
    // User
    if (!userId) {
      Alert.alert(
        'Error',
        'User belum login.'
      );
      return;
    }

    // Tanggal mulai
    if (!startDate) {
      Alert.alert(
        'Tanggal',
        'Silakan pilih tanggal mulai.'
      );
      return;
    }

    // Tanggal selesai
    if (!endDate) {
      Alert.alert(
        'Tanggal',
        'Silakan pilih tanggal selesai.'
      );
      return;
    }

    // Validasi tanggal
    if (endDate < startDate) {
      Alert.alert(
        'Tanggal',
        'Tanggal selesai tidak boleh sebelum tanggal mulai.'
      );
      return;
    }

    // Alasan
    if (!reason.trim()) {
      Alert.alert(
        'Alasan',
        'Alasan wajib diisi.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const startDateValue =
        formatDateForDatabase(
          startDate
        );

      const endDateValue =
        formatDateForDatabase(
          endDate
        );

      // ========================================
      // INSERT KE SUPABASE
      // ========================================

      const {
        data,
        error,
      } = await supabase
        .from('leave_requests')
        .insert({
          user_id: userId,

          // enum leave_type
          type: type,

          // PostgreSQL DATE
          start_date:
            startDateValue,

          end_date:
            endDateValue,

          reason:
            reason.trim(),

          // enum request_status
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error(
          'Gagal menyimpan pengajuan:',
          error
        );

        Alert.alert(
          'Pengajuan Gagal',
          error.message
        );

        return;
      }

      console.log(
        'Pengajuan berhasil:',
        data
      );

      Alert.alert(
        'Berhasil',
        `Pengajuan ${
          type === 'izin'
            ? 'izin'
            : 'cuti'
        } berhasil dikirim dan menunggu persetujuan.`
      );

      // Reset form
      setType('izin');
      setStartDate(null);
      setEndDate(null);
      setReason('');

      // Refresh data
      await loadData();
    } catch (error: any) {
      console.error(
        'Submit error:',
        error
      );

      Alert.alert(
        'Error',
        error?.message ||
          'Terjadi kesalahan.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================
  // STATUS TEXT
  // ========================================

  const getStatusText = (
    status: LeaveStatus
  ) => {
    switch (status) {
      case 'approved':
        return 'Disetujui';

      case 'rejected':
        return 'Ditolak';

      case 'pending':
      default:
        return 'Menunggu';
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
          Memuat data...
        </Text>
      </View>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.contentContainer
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ================================== */}
      {/* HEADER */}
      {/* ================================== */}

      <Text style={styles.title}>
        Izin & Cuti
      </Text>

      <Text style={styles.subtitle}>
        Ajukan izin atau cuti dan lihat
        riwayat pengajuan kamu.
      </Text>

      {/* ================================== */}
      {/* FORM */}
      {/* ================================== */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Ajukan Izin / Cuti
        </Text>

        {/* JENIS */}

        <Text style={styles.label}>
          Jenis Pengajuan
        </Text>

        <View style={styles.typeContainer}>
          <Pressable
            style={[
              styles.typeButton,
              type === 'izin' &&
                styles.typeButtonActive,
            ]}
            onPress={() =>
              setType('izin')
            }
          >
            <Text
              style={[
                styles.typeText,
                type === 'izin' &&
                  styles.typeTextActive,
              ]}
            >
              Izin
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.typeButton,
              type === 'cuti' &&
                styles.typeButtonActive,
            ]}
            onPress={() =>
              setType('cuti')
            }
          >
            <Text
              style={[
                styles.typeText,
                type === 'cuti' &&
                  styles.typeTextActive,
              ]}
            >
              Cuti
            </Text>
          </Pressable>
        </View>

        {/* ================================== */}
        {/* TANGGAL MULAI */}
        {/* ================================== */}

        <Text style={styles.label}>
          Tanggal Mulai
        </Text>

        <Pressable
          style={styles.dateButton}
          onPress={() =>
            setShowStartPicker(true)
          }
        >
          <Ionicons
            name={
                activeTab === 'attendance'
                ? 'calendar'
                : 'calendar-outline'
            }
            size={24}
            color={
                activeTab === 'attendance'
                ? '#2563EB'
                : '#64748B'
            }
        />
          <Text style={styles.calendarIcon}>
            
          </Text>

          <Text
            style={[
              styles.dateButtonText,
              !startDate &&
                styles.datePlaceholder,
            ]}
          >
            {formatDisplayDate(
              startDate
            )}
          </Text>
        </Pressable>

        {/* DATE PICKER START */}
          {showStartPicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display={
                Platform.OS === 'ios'
                  ? 'inline'
                  : 'calendar'
              }
              onChange={handleStartDateChange}
              minimumDate={new Date()}
              themeVariant="light"
            />
          )}
        {/* ================================== */}
        {/* TANGGAL SELESAI */}
        {/* ================================== */}

        <Text style={styles.label}>
          Tanggal Selesai
        </Text>

        <Pressable
          style={styles.dateButton}
          onPress={() =>
            setShowEndPicker(true)
          }
        >

          <Ionicons
            name={
                activeTab === 'attendance'
                ? 'calendar'
                : 'calendar-outline'
            }
            size={24}
            color={
                activeTab === 'attendance'
                ? '#2563EB'
                : '#64748B'
            }
        />
        
          <Text style={styles.calendarIcon}>
            
          </Text>

          <Text
            style={[
              styles.dateButtonText,
              !endDate &&
                styles.datePlaceholder,
            ]}
          >
            {formatDisplayDate(
              endDate
            )}
          </Text>
        </Pressable>

        {/* DATE PICKER END */}

        {showEndPicker && (
          <DateTimePicker
            value={
              endDate ||
              startDate ||
              new Date()
            }
            mode="date"
            display={
              Platform.OS === 'ios'
                ? 'inline'
                : 'calendar'
            }
            onChange={handleEndDateChange}
            minimumDate={
              startDate ||
              new Date()
            }
            themeVariant="light"
          />
        )}

        {/* ================================== */}
        {/* ALASAN */}
        {/* ================================== */}

        <Text style={styles.label}>
          Alasan
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.reasonInput,
          ]}
          placeholder="Masukkan alasan pengajuan..."
          placeholderTextColor="#94A3B8"
          value={reason}
          onChangeText={setReason}
          multiline
          textAlignVertical="top"
        />

        {/* ================================== */}
        {/* SUBMIT */}
        {/* ================================== */}

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            pressed &&
              styles.submitButtonPressed,
            submitting &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.submitText}>
              Ajukan Sekarang
            </Text>
          )}
        </Pressable>
      </View>

      {/* ================================== */}
      {/* RIWAYAT */}
      {/* ================================== */}

      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>
          Riwayat Pengajuan
        </Text>

        <Pressable
          onPress={loadData}
        >
          <Text style={styles.refreshText}>
            Refresh
          </Text>
        </Pressable>
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            Belum ada pengajuan
          </Text>

          <Text style={styles.emptyText}>
            Pengajuan izin atau cuti kamu
            akan muncul di sini.
          </Text>
        </View>
      ) : (
        requests.map((item) => (
          <View
            key={item.id}
            style={styles.historyCard}
          >
            {/* HISTORY HEADER */}

            <View
              style={styles.historyTop}
            >
              <View>
                <Text
                  style={styles.historyType}
                >
                  {item.type === 'izin'
                    ? 'Izin'
                    : 'Cuti'}
                </Text>

                <Text
                  style={styles.createdText}
                >
                  Diajukan{' '}
                  {formatDatabaseDate(
                    item.created_at.substring(
                      0,
                      10
                    )
                  )}
                </Text>
              </View>

              {/* STATUS */}

              <View
                style={[
                  styles.statusBadge,

                  item.status ===
                    'pending' &&
                    styles.statusPending,

                  item.status ===
                    'approved' &&
                    styles.statusApproved,

                  item.status ===
                    'rejected' &&
                    styles.statusRejected,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,

                    item.status ===
                      'pending' &&
                      styles.statusTextPending,

                    item.status ===
                      'approved' &&
                      styles.statusTextApproved,

                    item.status ===
                      'rejected' &&
                      styles.statusTextRejected,
                  ]}
                >
                  {getStatusText(
                    item.status
                  )}
                </Text>
              </View>
            </View>

            {/* TANGGAL */}

            <View style={styles.infoRow}>
              <Text
                style={styles.infoLabel}
              >
                Tanggal
              </Text>

              <Text
                style={styles.infoValue}
              >
                {formatDatabaseDate(
                  item.start_date
                )}

                {item.start_date !==
                  item.end_date &&
                  ` - ${formatDatabaseDate(
                    item.end_date
                  )}`}
              </Text>
            </View>

            {/* ALASAN */}

            <View
              style={
                styles.reasonContainer
              }
            >
              <Text
                style={styles.infoLabel}
              >
                Alasan
              </Text>

              <Text
                style={styles.reasonText}
              >
                {item.reason}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
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

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,

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
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 7,
  },

  typeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },

  typeButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  typeButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },

  typeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },

  typeTextActive: {
    color: '#2563EB',
  },

  // ========================================
  // DATE BUTTON
  // ========================================

  dateButton: {
    height: 52,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 14,

    marginBottom: 16,
  },

  calendarIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  dateButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },

  datePlaceholder: {
    color: '#94A3B8',
  },

  // ========================================
  // REASON
  // ========================================

  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',

    paddingHorizontal: 14,

    fontSize: 14,
    color: '#0F172A',

    marginBottom: 16,
  },

  reasonInput: {
    height: 110,
    paddingTop: 14,
  },

  // ========================================
  // SUBMIT
  // ========================================

  submitButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#2563EB',

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 4,
  },

  submitButtonPressed: {
    backgroundColor: '#1D4ED8',

    transform: [
      {
        scale: 0.97,
      },
    ],
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // ========================================
  // HISTORY
  // ========================================

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginTop: 28,
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

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,

    padding: 24,

    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',

    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },

  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,

    padding: 18,

    marginBottom: 12,

    elevation: 1,

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
    alignItems: 'flex-start',
    justifyContent: 'space-between',

    marginBottom: 16,
  },

  historyType: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },

  createdText: {
    fontSize: 11,
    color: '#94A3B8',

    marginTop: 3,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,

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
    fontSize: 11,
    fontWeight: '700',
  },

  statusTextPending: {
    color: '#D97706',
  },

  statusTextApproved: {
    color: '#16A34A',
  },

  statusTextRejected: {
    color: '#DC2626',
  },

  infoRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',

    paddingTop: 12,
    marginBottom: 12,
  },

  infoLabel: {
    fontSize: 12,
    color: '#94A3B8',

    marginBottom: 4,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },

  reasonContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',

    paddingTop: 12,
  },

  reasonText: {
    fontSize: 14,
    color: '#475569',

    lineHeight: 20,
  },
});