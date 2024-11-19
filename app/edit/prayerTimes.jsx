import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for the back arrow
import { router } from 'expo-router'; // Import router from expo-router
import { Context } from '../../components/globalContext';
import TimeTable from '../../components/TimeTable';
import CustomButton from '../../components/CustomButton';

const PrayerTimes = () => {
  const { fetchPrayerTimes, updatePrayerTimes, user } = useContext(Context);
  const [prayerTimes, setPrayerTimes] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadPrayerTimes = async () => {
      const data = await fetchPrayerTimes(user.mosque.mosque_id);
      console.log("data:", JSON.stringify(data, null, 2));

      if (data) {
        setPrayerTimes(data);
      }
    };

    loadPrayerTimes();
  }, [user]);

  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleInputChange = (field, value) => {
    setPrayerTimes((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Format today's date as "YYYY-MM-DD"
    const date = new Date().toISOString().split('T')[0];
  
    // Structure the prayerTimes object to match the backend expectations
    const formattedPrayerTimes = {
      Iqama_Fajr: prayerTimes.Fajr,
      Iqama_Zuhr: prayerTimes.Zuhr,
      Iqama_Asr: prayerTimes.Asr,
      Iqama_Maghrib: prayerTimes.Maghrib,
      Iqama_Isha: prayerTimes.Isha,
    };
  
    // Call the updatePrayerTimes function and pass in both date and formatted prayer times
    const result = await updatePrayerTimes(user.mosque.mosque_id, { date, prayer_times: formattedPrayerTimes });
    
    if (result) {
      Alert.alert("Success", "Prayer times updated successfully.");
      setIsEditing(false);
    } else {
      Alert.alert("Error", "Failed to update prayer times.");
    }
  };
  

  return (
    <SafeAreaView className="flex-1 bg-primary p-4">
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} className="mb-4">
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      <Text className="text-white text-lg font-pbold mb-4">Prayer Times</Text>

      {isEditing ? (
        Object.entries(prayerTimes).map(([time, value]) => (
          <View key={time} className="mb-5">
            <Text className="text-gray-300">{time.replace('_', ' ')}:</Text>
            <TextInput
              value={value}
              onChangeText={(text) => handleInputChange(time, text)}
              className="border-b-2 border-secondary text-white"
            />
          </View>
        ))
      ) : (
        <View>
        <TimeTable
          mosque={{
            name: user.mosque.mosquename,
            fajr: prayerTimes.Iqama_Fajr,
            dhuhr: prayerTimes.Iqama_Zuhr,
            asr: prayerTimes.Iqama_Asr,
            maghrib: prayerTimes.Iqama_Maghrib,
            isha: prayerTimes.Iqama_Isha,
          }}
        />
      </View>
      )}

      <CustomButton
        title={isEditing ? "Save Changes" : "Edit Times"}
        handlePress={isEditing ? handleSave : handleEditToggle}
        containerStyles="mt-4"
      />
    </SafeAreaView>
  );
};

export default PrayerTimes;
