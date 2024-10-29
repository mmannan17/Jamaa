import React, { useContext, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Context } from '../../components/globalContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const FollowingScreen = () => {
  const { followedMosques, getFollowedMosques } = useContext(Context);
  const router = useRouter();

  useEffect(() => {
    getFollowedMosques(); // Fetch followed mosques when this screen loads
  }, []);

  const handleMosquePress = (mosque) => {
    console.log(mosque);
    router.push(`/mosque/${mosque}`);
  };

  return (
    <View className="flex-1 bg-primary">
      {/* Header with Back Arrow and Title */}
        <View className="flex-row items-center mt-20 mb-4 px-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={26} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold ml-12">Followed Mosques</Text>
      </View>
      
      <FlatList
        data={followedMosques}
        keyExtractor={(item, index) => (item.mosque_id ? item.mosque_id.toString() : index.toString())}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleMosquePress(item)}
            className="bg-black-100 p-4 m-2 rounded-lg"
          >
            <Text className="text-white text-lg font-psemibold">
              {item.mosquename || item.mosque?.mosquename}
            </Text>
            <Text className="text-gray-300 mt-1">
              Address: {item.mosque?.address || 'No address available'}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center mt-10">
            <Text className="text-white text-lg">No followed mosques found</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 10 }}
      />
    </View>
  );
};

export default FollowingScreen;
