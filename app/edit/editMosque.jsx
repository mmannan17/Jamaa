import React, { useState, useContext } from 'react';
import { View, Text, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Context } from '../../components/globalContext';
import FormField from '../../components/FormField';  // Using FormField for input consistency
import CustomButton from '../../components/CustomButton';
import { Ionicons } from '@expo/vector-icons';

const EditProfile = () => {
  const { user, editMosque } = useContext(Context);
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.mosque?.email || '');
  const [address, setAddress] = useState(user?.mosque?.address || '');
  const router = useRouter();

  const handleSave = async () => {
    if (!username.trim() || !email.trim() || !address.trim()) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    const success = await editMosque({ username, email, address });
    if (success) {
      Alert.alert("Success", "Profile updated successfully.");
      router.back();
    } else {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      {/* Back Button */}
      <TouchableOpacity
        className="absolute top-20 left-4 z-10"
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}>
        <View className="w-full justify-start min-h-[75vh] px-4 mt-2">
          <Text className="text-2xl text-white font-psemibold text-center mb-4">Edit Profile</Text>

          {/* Username Field */}
          <FormField 
            title="Username"
            value={username}
            handleChangeText={setUsername}
            placeholder="Enter Username"
            otherStyles="mt-4"
          />

          {/* Email Field */}
          <FormField 
            title="Email"
            value={email}
            handleChangeText={setEmail}
            placeholder="Enter Email"
            keyboardType="email-address"
            otherStyles="mt-4"
          />

          {/* Address Field */}
          <FormField 
            title="Address"
            value={address}
            handleChangeText={setAddress}
            placeholder="Enter Address"
            otherStyles="mt-4"
          />

          {/* Save Button */}
          <CustomButton
            title="Save Changes"
            handlePress={handleSave}
            containerStyles="mt-7 p-4"
            textStyles="text-black text-lg font-psemibold"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfile;
