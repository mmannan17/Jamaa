import React, { useContext } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Context } from '../../components/globalContext';
import { useRouter } from 'expo-router'; // Import useRouter from Expo Router
import { Ionicons } from '@expo/vector-icons';

const Settings = () => {
  const { logout } = useContext(Context);
  const router = useRouter(); // Use router for navigation

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="w-full px-4 mt-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
        <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-psemibold text-white mb-6">Settings</Text>
        
        <TouchableOpacity onPress={logout}>
          <Text className="text-base text-red-600">Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Settings;
