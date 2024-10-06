import React, { useState, useContext, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Context } from '../../components/globalContext';

const Bookmark = () => {
  const router = useRouter();
  const { mosques, nearbyMosques, getMosques } = useContext(Context);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMosquePress = (mosque) => {
    if (mosque && mosque.id) {
      console.log(mosque);
      router.push(`/mosque/${mosque.id}`);
    } else {
      console.error('Invalid mosque object:', mosque);
      Alert.alert('Error', 'Unable to view mosque profile.');
    }
  }

  const filteredMosques = searchQuery
    ? mosques.filter(mosque =>
        mosque.mosque.mosquename.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : nearbyMosques;

  const renderNearbyMosques = () => (
    <FlatList
      data={nearbyMosques}
      keyExtractor={(item) => item.mosque_id.toString()}
      renderItem={({item}) => (
        <TouchableOpacity 
          onPress={() => handleMosquePress(item)}
          className="bg-black-100 p-4 m-2 rounded-lg"
        >
          <Text className="text-white text-lg font-psemibold">Mosque ID: {item.mosque_id}</Text>
          <Text className="text-gray-300 mt-1">Distance: {item.distance_miles} miles</Text>
        </TouchableOpacity>
      )}
    />
  );

  const renderSearchResults = () => (
    <FlatList
      data={filteredMosques}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({item}) => (
        <TouchableOpacity
          onPress={() => handleMosquePress(item)}
          className="bg-black-100 p-4 m-2 rounded-lg"
        >
          <Text className="text-white text-lg font-psemibold">{item.mosque.mosquename || `Mosque ID: ${item.mosque.mosque_id}`}</Text>
          <Text className="text-gray-300 mt-1">Address: {item.mosque.address}</Text>
          {item.distance && <Text className="text-gray-300">Distance: {item.distance.toFixed(2)} miles</Text>}
        </TouchableOpacity>
      )}
    />
  );

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="px-4 mt-8">
        <Text className="text-white text-2xl font-psemibold mb-4">Nearby Mosques</Text>
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
      {filteredMosques.length > 0 ? (
        searchQuery ? renderSearchResults() : renderNearbyMosques()
      ) : (
        <View className="flex-1 items-center mt-5">
          <Text className="text-white text-lg">No mosques nearby</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Bookmark;