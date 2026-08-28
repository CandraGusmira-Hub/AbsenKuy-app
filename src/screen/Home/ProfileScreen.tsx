import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { supabase } from '../../lib/supabase';

type Profile = {
  id: string;
  nama: string;
  username: string;
  email: string;
};

export default function ProfileScreen() {
  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [nama, setNama] =
    useState('');

  const [username, setUsername] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  // ========================================
  // AMBIL PROFILE
  // ========================================

  const loadProfile = useCallback(
    async () => {
      try {
        // Ambil user yang sedang login
        const {
          data: {
            user,
          },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            'Gagal mengambil user:',
            userError
          );

          Alert.alert(
            'Gagal',
            'Gagal mengambil data pengguna.'
          );

          return;
        }

        if (!user) {
          Alert.alert(
            'Belum Login',
            'Silakan login terlebih dahulu.'
          );

          router.replace('/login');

          return;
        }

        // ====================================
        // AMBIL DATA PROFILE
        // ====================================

        const {
          data,
          error,
        } = await supabase
          .from('profiles')
          .select(`
            id,
            nama,
            username,
            email
          `)
          .eq('id', user.id)
          .single();

        if (error) {
          console.error(
            'Gagal mengambil profile:',
            error
          );

          Alert.alert(
            'Gagal',
            'Data profile tidak dapat diambil.'
          );

          return;
        }

        if (!data) {
          Alert.alert(
            'Profile Tidak Ditemukan',
            'Data profile kamu belum tersedia.'
          );

          return;
        }

        // Simpan profile
        setProfile(data);

        setNama(
          data.nama || ''
        );

        setUsername(
          data.username || ''
        );
      } catch (error) {
        console.error(
          'Error profile:',
          error
        );

        Alert.alert(
          'Error',
          'Terjadi kesalahan saat mengambil profile.'
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
    loadProfile();
  }, [loadProfile]);

  // ========================================
  // REFRESH
  // ========================================

  const handleRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  // ========================================
  // SIMPAN PROFILE
  // ========================================

  const handleSave = async () => {
    if (!profile) {
      return;
    }

    if (!nama.trim()) {
      Alert.alert(
        'Nama Kosong',
        'Nama tidak boleh kosong.'
      );

      return;
    }

    if (!username.trim()) {
      Alert.alert(
        'Username Kosong',
        'Username tidak boleh kosong.'
      );

      return;
    }

    try {
      setSaving(true);

      const {
        data,
        error,
      } = await supabase
        .from('profiles')
        .update({
          nama: nama.trim(),
          username: username.trim(),
        })
        .eq('id', profile.id)
        .select(`
          id,
          nama,
          username,
          email
        `)
        .single();

      if (error) {
        console.error(
          'Gagal update profile:',
          error
        );

        Alert.alert(
          'Gagal',
          error.message ||
            'Gagal menyimpan perubahan profile.'
        );

        return;
      }

      if (data) {
        setProfile(data);

        setNama(
          data.nama || ''
        );

        setUsername(
          data.username || ''
        );
      }

      setEditing(false);

      Alert.alert(
        'Berhasil',
        'Profile berhasil diperbarui.'
      );
    } catch (error) {
      console.error(
        'Error update profile:',
        error
      );

      Alert.alert(
        'Error',
        'Terjadi kesalahan saat menyimpan profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // BATAL EDIT
  // ========================================

  const handleCancel = () => {
    if (!profile) {
      return;
    }

    setNama(
      profile.nama || ''
    );

    setUsername(
      profile.username || ''
    );

    setEditing(false);
  };

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah kamu yakin ingin keluar?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const {
                error,
              } =
                await supabase.auth.signOut();

              if (error) {
                Alert.alert(
                  'Gagal',
                  'Gagal melakukan logout.'
                );

                return;
              }

              router.replace(
                '/login'
              );
            } catch (error) {
              console.error(
                'Logout error:',
                error
              );

              Alert.alert(
                'Error',
                'Terjadi kesalahan saat logout.'
              );
            }
          },
        },
      ]
    );
  };

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
          style={
            styles.loadingText
          }
        >
          Memuat profile...
        </Text>
      </View>
    );
  }

  // ========================================
  // JIKA PROFILE TIDAK ADA
  // ========================================

  if (!profile) {
    return (
      <View
        style={
          styles.emptyContainer
        }
      >
        <Text
          style={
            styles.emptyIcon
          }
        >
          👤
        </Text>

        <Text
          style={
            styles.emptyTitle
          }
        >
          Profile tidak ditemukan
        </Text>

        <Text
          style={
            styles.emptyText
          }
        >
          Data profile kamu belum tersedia.
        </Text>

        <Pressable
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            Kembali
          </Text>
        </Pressable>
      </View>
    );
  }

  // ========================================
  // INISIAL AVATAR
  // ========================================

  const initial =
    profile.nama
      ? profile.nama
          .charAt(0)
          .toUpperCase()
      : '?';

  // ========================================
  // SCREEN
  // ========================================

  return (
    <View
      style={styles.container}
    >
      {/* ====================================
          HEADER
      ==================================== */}

      <View
        style={styles.header}
      >
        <Pressable
          style={styles.headerBack}
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={styles.headerBackText}
          >
            ‹
          </Text>
        </Pressable>

        <View
          style={
            styles.headerContent
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            Profile
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Kelola informasi akun kamu
          </Text>
        </View>
      </View>

      {/* ====================================
          CONTENT
      ==================================== */}

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
          />
        }
      >
        {/* ==================================
            PROFILE HEADER
        ================================== */}

        <View
          style={
            styles.profileHeader
          }
        >
          <View
            style={styles.avatar}
          >
            <Text
              style={
                styles.avatarText
              }
            >
              {initial}
            </Text>
          </View>

          <Text
            style={
              styles.profileName
            }
          >
            {profile.nama}
          </Text>

          <Text
            style={
              styles.profileUsername
            }
          >
            @{profile.username}
          </Text>
        </View>

        {/* ==================================
            DATA PROFILE
        ================================== */}

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.cardTitle
            }
          >
            Informasi Akun
          </Text>

          {/* NAMA */}

          <View
            style={
              styles.fieldContainer
            }
          >
            <Text
              style={
                styles.fieldLabel
              }
            >
              Nama Lengkap
            </Text>

            {editing ? (
              <TextInput
                value={nama}
                onChangeText={
                  setNama
                }
                placeholder="Masukkan nama"
                placeholderTextColor="#94A3B8"
                style={
                  styles.input
                }
              />
            ) : (
              <Text
                style={
                  styles.fieldValue
                }
              >
                {profile.nama ||
                  '-'}
              </Text>
            )}
          </View>

          {/* USERNAME */}

          <View
            style={
              styles.fieldContainer
            }
          >
            <Text
              style={
                styles.fieldLabel
              }
            >
              Username
            </Text>

            {editing ? (
              <TextInput
                value={username}
                onChangeText={
                  setUsername
                }
                placeholder="Masukkan username"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                style={
                  styles.input
                }
              />
            ) : (
              <Text
                style={
                  styles.fieldValue
                }
              >
                @{profile.username ||
                  '-'}
              </Text>
            )}
          </View>

          {/* EMAIL */}

          <View
            style={
              styles.fieldContainer
            }
          >
            <Text
              style={
                styles.fieldLabel
              }
            >
              Email
            </Text>

            <Text
              style={[
                styles.fieldValue,
                styles.emailValue,
              ]}
            >
              {profile.email ||
                '-'}
            </Text>
          </View>
        </View>

        {/* ==================================
            BUTTON
        ================================== */}

        {editing ? (
          <View
            style={
              styles.buttonRow
            }
          >
            <Pressable
              style={
                styles.cancelButton
              }
              onPress={
                handleCancel
              }
              disabled={saving}
            >
              <Text
                style={
                  styles.cancelButtonText
                }
              >
                Batal
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.saveButton
              }
              onPress={
                handleSave
              }
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Simpan
                </Text>
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={
              styles.editButton
            }
            onPress={() =>
              setEditing(true)
            }
          >
            <Text
              style={
                styles.editButtonText
              }
            >
            Edit Profile
            </Text>
          </Pressable>
        )}

        {/* ==================================
            LOGOUT
        ================================== */}

        <Pressable
          style={
            styles.logoutButton
          }
          onPress={
            handleLogout
          }
        >
          <Text
            style={
              styles.logoutText
            }
          >
            Keluar dari Akun
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ========================================
// STYLES
// ========================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#F8FAFC',
    },

    // ====================================
    // LOADING
    // ====================================

    loadingContainer: {
      flex: 1,
      backgroundColor:
        '#F8FAFC',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: '#64748B',
    },

    // ====================================
    // EMPTY
    // ====================================

    emptyContainer: {
      flex: 1,
      backgroundColor:
        '#F8FAFC',
      alignItems: 'center',
      justifyContent:
        'center',
      padding: 30,
    },

    emptyIcon: {
      fontSize: 50,
      marginBottom: 15,
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#0F172A',
      marginBottom: 6,
    },

    emptyText: {
      fontSize: 14,
      color: '#64748B',
      textAlign: 'center',
      marginBottom: 20,
    },

    // ====================================
    // HEADER
    // ====================================

    header: {
      backgroundColor:
        '#FFFFFF',
      paddingTop: 55,
      paddingBottom: 18,
      paddingHorizontal: 20,

      flexDirection: 'row',
      alignItems: 'center',

      borderBottomWidth: 1,
      borderBottomColor:
        '#E2E8F0',
    },

    headerBack: {
      width: 40,
      height: 40,
      justifyContent:
        'center',
    },

    headerBackText: {
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

    // ====================================
    // CONTENT
    // ====================================

    content: {
      padding: 20,
      paddingBottom: 40,
    },

    // ====================================
    // PROFILE HEADER
    // ====================================

    profileHeader: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 16,
      paddingVertical: 28,
      alignItems: 'center',
      marginBottom: 16,

      elevation: 2,

      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,

      shadowOffset: {
        width: 0,
        height: 3,
      },
    },

    avatar: {
      width: 82,
      height: 82,
      borderRadius: 41,
      backgroundColor:
        '#DBEAFE',

      alignItems: 'center',
      justifyContent:
        'center',

      marginBottom: 12,
    },

    avatarText: {
      fontSize: 32,
      fontWeight: '700',
      color: '#2563EB',
    },

    profileName: {
      fontSize: 20,
      fontWeight: '700',
      color: '#0F172A',
    },

    profileUsername: {
      fontSize: 13,
      color: '#64748B',
      marginTop: 4,
    },

    // ====================================
    // CARD
    // ====================================

    card: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,

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
      fontSize: 17,
      fontWeight: '700',
      color: '#0F172A',
      marginBottom: 18,
    },

    // ====================================
    // FIELD
    // ====================================

    fieldContainer: {
      marginBottom: 18,
    },

    fieldLabel: {
      fontSize: 12,
      color: '#64748B',
      marginBottom: 6,
    },

    fieldValue: {
      fontSize: 15,
      fontWeight: '600',
      color: '#0F172A',
    },

    emailValue: {
      color: '#475569',
    },

    input: {
      borderWidth: 1,
      borderColor: '#CBD5E1',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
      fontSize: 15,
      color: '#0F172A',
      backgroundColor:
        '#FFFFFF',
    },

    // ====================================
    // EDIT BUTTON
    // ====================================

    editButton: {
      backgroundColor:
        '#2563EB',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom: 12,
    },

    editButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },

    // ====================================
    // SAVE / CANCEL
    // ====================================

    buttonRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },

    cancelButton: {
      flex: 1,
      backgroundColor:
        '#E2E8F0',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    cancelButtonText: {
      color: '#475569',
      fontSize: 15,
      fontWeight: '700',
    },

    saveButton: {
      flex: 1,
      backgroundColor:
        '#2563EB',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },

    // ====================================
    // LOGOUT
    // ====================================

    logoutButton: {
      borderWidth: 1,
      borderColor:
        '#FECACA',
      backgroundColor:
        '#FEF2F2',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    logoutText: {
      color: '#DC2626',
      fontSize: 15,
      fontWeight: '700',
    },

    // ====================================
    // BACK
    // ====================================

    backButton: {
      backgroundColor:
        '#2563EB',
      borderRadius: 10,
      paddingHorizontal: 22,
      paddingVertical: 12,
    },

    backButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });