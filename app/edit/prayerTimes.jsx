import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for the back arrow
import { router } from 'expo-router'; // Import router from expo-router
import { Context } from '../../components/globalContext';
import TimeTable from '../../components/TimeTable';
import CustomButton from '../../components/CustomButton';
import * as DocumentPicker from 'expo-document-picker';

const PrayerTimes = () => {
  const { fetchPrayerTimes, updatePrayerTimes, uploadPrayerTimes, user } = useContext(Context);
  const [prayerTimes, setPrayerTimes] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadPageVisible, setIsUploadPageVisible] = useState(false); // Track whether the upload page is visible

  useEffect(() => {
    const loadPrayerTimes = async () => {
      const data = await fetchPrayerTimes(user.mosque.mosque_id);
      console.log("data:", JSON.stringify(data, null, 2));

      // Set each prayer time to 'N/A' if it's missing or null
      setPrayerTimes({
        Fajr: data?.Fajr || 'N/A',
        Zuhr: data?.Zuhr || 'N/A',
        Asr: data?.Asr || 'N/A',
        Maghrib: data?.Maghrib || 'N/A',
        Isha: data?.Isha || 'N/A',
      });
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
      Fajr: prayerTimes?.Fajr,
      Zuhr: prayerTimes?.Zuhr,
      Asr: prayerTimes?.Asr,
      Maghrib: prayerTimes?.Maghrib,
      Isha: prayerTimes?.Isha,
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

  const handleUploadPress = () => {
    setIsUploadPageVisible(true); // Show the upload page when the button is pressed
  };

  const handleUpload = async () => {
    try {
      // Show the document picker with only Excel files
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],  // Accept both .xls and .xlsx
        multiple: false, // Allow only one file to be selected
      });

      console.log("File selected:", res);

      // Check if the user canceled the picker
      if (res.type === 'cancel') {
        console.log("User canceled file picker");
        return;
      }

      // Optional: Check if the file type is correct (this is redundant since we already filter by type)
      if (
        res.assets[0].mimeType !== 'application/vnd.ms-excel' &&
        res.assets[0].mimeType !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        Alert.alert("Invalid file type", "Please select an Excel (.xls or .xlsx) file.");
        return;
      }

      setIsUploading(true);

      // Call the function to upload the file (you'll need to define this function based on your app logic)
      const result = await uploadPrayerTimes(res.uri, res.name);
      console.log('Upload result:', result);

      if (result && result.status === 'success') {
        Alert.alert("Success", "Prayer times uploaded successfully.");
      } else {
        Alert.alert("Error", "Failed to upload prayer times.");
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log("User canceled file picker");
      } else {
        console.error("File Picker Error:", err);
        Alert.alert("Error", "Failed to pick file.");
      }
    } finally {
      setIsUploading(false);
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
              value={value}  // Ensure that if value is falsy, 'N/A' is shown
              onChangeText={(text) => handleInputChange(time, text)}
              className="border-b-2 border-secondary text-white"
            />
          </View>
        ))
      ) : (
        <View>
          <TimeTable
            mosque={{
              name: user.mosque.mosquename ? user.mosque.mosquename : 'N/A',
              fajr: prayerTimes?.Fajr ? prayerTimes.Fajr  : 'N/A',
              dhuhr: prayerTimes?.Zuhr ? prayerTimes.Zuhr : 'N/A',
              asr: prayerTimes?.Asr ? prayerTimes.Asr : 'N/A',
              maghrib: prayerTimes?.Maghrib ? prayerTimes.Maghrib : 'N/A',
              isha: prayerTimes?.Isha ? prayerTimes.Isha : 'N/A',
            }}
          />
        </View>
      )}

      {/* Edit Button */}
      <CustomButton
        title={isEditing ? "Save Changes" : "Edit Times"}
        handlePress={isEditing ? handleSave : handleEditToggle}
        containerStyles="mt-4"
      />

      {/* Upload Button */}
      {!isEditing && (
        <CustomButton
          title={isUploading ? "Uploading..." : "Upload Prayer Times"}
          handlePress={handleUploadPress} // Show the upload page first
          containerStyles="mt-4"
          disabled={isUploading}
        />
      )}

      {/* Upload Page */}
      {isUploadPageVisible && (
        <View className="absolute top-0 left-0 right-0 bottom-0 flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white p-6 rounded-lg">
            <Text className="text-lg font-semibold">Please select only an Excel file</Text>
            <CustomButton
              title="Upload File"
              handlePress={handleUpload}
              containerStyles="mt-4"
            />
            <CustomButton
              title="Cancel"
              handlePress={() => setIsUploadPageVisible(false)} // Close the upload page
              containerStyles="mt-4 bg-red-500"
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default PrayerTimes;
