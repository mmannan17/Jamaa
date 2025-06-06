import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Context } from '../../components/globalContext';
import NewSearchInput from '../../components/NewSearchInput';
import { Ionicons } from '@expo/vector-icons';

const Explore = () => {
  const router = useRouter();
  const { getNearbyMosques, nearbyMosques, nearbyEvents, mosques } = useContext(Context);
  
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [filteredMosques, setFilteredMosques] = useState([]);
  
  const screenWidth = Dimensions.get('window').width;
  const [inputWidth] = useState(new Animated.Value(screenWidth - 20));
  const [arrowOpacity] = useState(new Animated.Value(0));
  const [marginLeft] = useState(new Animated.Value(0)); // Animate marginLeft

  const searchInputRef = useRef(null);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredMosques(nearbyMosques); // Show nearby mosques if search is empty
    } else {
      const filtered = mosques.filter(mosque =>
        mosque.mosque?.mosquename.toLowerCase().startsWith(search.toLowerCase())
      );
      console.log(filtered);
      setFilteredMosques(filtered);
    }
  }, [search, mosques, nearbyMosques]);

  const handleMosquePress = (mosque) => {
    if (mosque.mosque) {
      router.push(`/mosque/${mosque.mosque.mosque_id}`);
    }
    else if (mosque) {
      router.push(`/mosque/${mosque.mosque_id}`);
    } else {
      Alert.alert('Error', 'Unable to view mosque profile.');
    }
  };

  const handleFocus = () => {
    setIsFocused(true);

    Animated.timing(inputWidth, {
      toValue: screenWidth * 0.85, // Shrink from both sides
      duration: 200,
      useNativeDriver: false,
    }).start();

    Animated.timing(marginLeft, {
      toValue: 25, // Set marginLeft when focused
      duration: 200,
      useNativeDriver: false,
    }).start();

    Animated.timing(arrowOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);

    Animated.timing(inputWidth, {
      toValue: screenWidth - 20, // Expand from both sides
      duration: 200,
      useNativeDriver: false,
    }).start();

    Animated.timing(marginLeft, {
      toValue: 0, // Revert marginLeft when not focused
      duration: 200,
      useNativeDriver: false,
    }).start();

    Animated.timing(arrowOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setSearch('');
  };

  const handleBackPress = () => {
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
    handleBlur();
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="px-4 mt-8 flex-row items-center">
        <Animated.View style={{ opacity: arrowOpacity, position: 'absolute', left: 10 }}>
          <TouchableOpacity onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ width: inputWidth, marginLeft: marginLeft }}>
          <NewSearchInput 
            ref={searchInputRef}
            query={search}
            setQuery={setSearch}
            onFocus={handleFocus}
          />
        </Animated.View>
      </View>

      {/* Conditionally render filtered mosques or nearby events */}
      {isFocused ? (
        <FlatList
          data={filteredMosques}
          keyExtractor={(item, index) => (item.mosque_id ? item.mosque_id.toString() : index.toString())}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleMosquePress(item)}
              className="bg-black-100 p-4 m-2 rounded-lg"
            >
              <Text className="text-white text-lg font-psemibold">{item.mosquename ||  item.mosque.mosquename}</Text>
              <Text className="text-gray-300 mt-1">
                {item.distance_miles ? `Distance: ${item.distance_miles} Miles` : `Address: ${item.mosque?.address}`}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center mt-10">
              <Text className="text-white text-lg">No mosques found nearby</Text>
            </View>
          )}
        />
      ) : (
        <FlatList
        data={nearbyEvents}
        keyExtractor={(item) => item.event_id.toString()}
        renderItem={({ item }) => (
          <PostCard
            post={{
              title: item.title,
              posttype: item.type, // Assuming there's a type for events
              content: item.description, // Assuming event has a description
              media_file: item.media_file,
              timestamp: item.timestamp,
              mosque: item.mosque, // Assuming the event is linked to a mosque
              media_type: item.media_type,
              profile_pic: item.profile_pic, // Assuming you want to show a profile pic related to event creator
            }}
          />
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center mt-10">
            <Text className="text-white text-lg">No nearby events found</Text>
          </View>
        )}
      />
      )}
    </SafeAreaView>
  );
};

export default Explore;
