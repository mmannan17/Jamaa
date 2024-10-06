import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Context } from '../../components/globalContext';

const Bookmark = () => {
  const router = useRouter();
  const { mosques } = useContext(Context);
  const [filteredMosques, setFilteredMosques] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setFilteredMosques(mosques);
  }, [mosques]);

  useEffect(() => {
    const filtered = mosques.filter(mosque =>
      mosque.mosque.mosquename.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMosques(filtered);
  }, [searchQuery, mosques]);

  const handleMosqueSelect = (mosque) => {
    if (mosque && mosque.id) {
      console.log(mosque);
      router.push(`/mosque/${mosque.id}`);
    } else {
      console.error('Invalid mosque object:', mosque);
      Alert.alert('Error', 'Unable to view mosque profile.');
    }
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="px-4 mt-8">
        <Text className="text-white text-2xl font-psemibold mb-4">Search Mosques</Text>
        <View className="border-2 border-black-200 rounded-2xl focus:border-secondary items-center w-full h-16 px-4 bg-black-100 flex-row space-x-4 my-2">
          <TextInput
            className="text-base text-white flex-1 font-pregular"
            placeholder="Search for a Masjid"
            placeholderTextColor="#CDCDE0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      <FlatList
        data={filteredMosques}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => handleMosqueSelect(item)}
            className="bg-black-100 p-4 m-2 rounded-lg"
          >
            <Text className="text-white text-lg font-psemibold">{item.mosque.mosquename || `Mosque ID: ${item.mosque.mosque_id}`}</Text>
            <Text className="text-gray-300 mt-1">Address: {item.mosque.address}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center mt-10">
            <Text className="text-white text-lg">No mosques found</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default Bookmark;