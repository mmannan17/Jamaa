import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Context } from '../../components/globalContext';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

const SettingsButton = ({ title, icon, color = "#fff", onPress, isDestructive }) => (
  <TouchableOpacity 
    onPress={onPress}
    className={`flex-row items-center w-full p-4 mb-3 rounded-xl ${isDestructive ? 'bg-red-600' : 'bg-[#1E1E2D]'}`}
  >
    {icon}
    <Text className={`text-${isDestructive ? 'white' : color} text-lg ml-3`}>{title}</Text>
    <MaterialIcons 
      name="chevron-right" 
      size={24} 
      color={color} 
      style={{ marginLeft: 'auto' }}
    />
  </TouchableOpacity>
);

const Settings = () => {
  const { logout } = useContext(Context);
  const router = useRouter();

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="w-full px-4 mt-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={26} color="white" />
        </TouchableOpacity>
      </View>
      
      <View className="flex-1 px-4 mt-4">
        <SettingsButton
          title="Contact Us"
          icon={<MaterialIcons name="contact-support" size={24} color="#FFD700" />}
          onPress={() => {/* Add contact logic */}}
          color="white"
        />
        
        <SettingsButton
          title="Leave Feedback"
          icon={<FontAwesome name="star" size={24} color="#FFD700" />}
          onPress={() => {/* Add review logic */}}
          color="white"
        />
        
        <SettingsButton
          title="Logout"
          icon={<MaterialIcons name="logout" size={24} color="white" />}
          onPress={logout}
          isDestructive={true}
        />
      </View>
    </SafeAreaView>
  );
};

export default Settings;
