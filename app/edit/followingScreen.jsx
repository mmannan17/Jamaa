import React, { useContext, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Context } from '../../components/globalContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const FollowingScreen = () => {
  const { followedMosques, getFollowedMosques, mosques, getMosques } = useContext(Context);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      await getFollowedMosques();
      await getMosques(); // Fetch all mosques to get details
    };
    fetchData();
  }, []);

  // Get full mosque details for followed mosques
  const followedMosqueDetails = followedMosques.map(mosqueId => {
    return mosques.find(m => m.mosque?.mosque_id === mosqueId);
  }).filter(mosque => mosque !== undefined);

  const handleMosquePress = (mosque) => {
    if (mosque && mosque.mosque) {
      router.push(`/mosque/${mosque.mosque.mosque_id}`);
    }
  };

  return (
    <View className="flex-1 bg-primary">
      <View className="flex-row items-center mt-20 mb-4 px-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={26} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold ml-12">Followed Mosques</Text>
      </View>
      
      <FlatList
        data={followedMosqueDetails}
        keyExtractor={(item) => item.mosque.mosque_id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleMosquePress(item)}
            className="bg-black-100 p-4 m-2 rounded-lg"
          >
            <Text className="text-white text-lg font-psemibold">
              {item.mosque.mosquename}
            </Text>
            <Text className="text-gray-300 mt-1">
              Address: {item.mosque.address || 'No address available'}
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
