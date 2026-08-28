import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="dashboard"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="leave-requests"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="admin/attendance"
        options={{
            headerShown: false,
        }}
        />
    </Stack>
  );
}