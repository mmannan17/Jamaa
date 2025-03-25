import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native'
import React, { useContext, useMemo } from 'react'
import { useLocalSearchParams, router, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Context } from '../../components/globalContext'
import { icons } from '../../constants';

const Search = () => {
  const { query } = useLocalSearchParams()
  const { mosques } = useContext(Context)

  const searchResults = useMemo(() => {
    const decodedQuery = decodeURIComponent(query).toLowerCase()
    
    // Filter mosques
    return mosques.filter(mosque => 
      (mosque.username && mosque.username.toLowerCase().includes(decodedQuery)) ||
      (mosque.address && mosque.address.toLowerCase().includes(decodedQuery))
    ).sort((a, b) => a.username.localeCompare(b.username))
  }, [query, mosques])

  const handleMosquePress = (mosque) => {
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
      <TouchableOpacity 
        onPress={() => router.back()} 
        className="top-4 left-4 z-10"
      >
        <Image
          source={icons.leftArrow}
          className="w-6 h-6"
          resizeMode="contain"
        />
      </TouchableOpacity>
      <Text className="text-3xl text-white font-psemibold mt-5 p-4">Search Results for "{decodeURIComponent(query)}"</Text>
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            className="bg-black-100 p-4 m-2 rounded-lg"
            onPress={() => handleMosquePress(item)}
          >
            <Text className="text-white text-lg font-psemibold">{item.username}</Text>
            <Text className="text-gray-300 mt-1">{item.mosque.address || 'Address not available'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <Text className="text-white text-center p-4">No mosques found</Text>
        )}
      />
    </SafeAreaView>
  )
}

export default Search