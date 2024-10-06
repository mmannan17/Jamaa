import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Context } from '../../components/globalContext';
import NewSearchInput from '../../components/NewSearchInput'; // Import your NewSearchInput component
import { Ionicons } from '@expo/vector-icons'; // Import icons for the back arrow

const Explore = () => {
  const router = useRouter();
  const { getNearbyMosques, nearbyMosques, nearbyEvents } = useContext(Context);
  
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);  // Tracks if search bar is focused
  const [filteredMosques, setFilteredMosques] = useState([]);
  
  const screenWidth = Dimensions.get('window').width;
  const [inputWidth] = useState(new Animated.Value(screenWidth - 20)); // Full screen width initially
  const [arrowOpacity] = useState(new Animated.Value(0)); // Back arrow opacity (initially hidden)

  const searchInputRef = useRef(null);  // Reference to search input to trigger focus/blur
  console.log(nearbyMosques)

  useEffect(() => {
    if (search === '') {
      setFilteredMosques(nearbyMosques); // Show all mosques if search is empty
    } else {
      console.log(nearbyMosques)
      const filtered = nearbyMosques.filter(mosque =>
        mosque.name.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredMosques(filtered); // Update filtered list
    }
  }, [search, nearbyMosques]);

  const handleMosquePress = (mosque) => {
    // Prevent the search bar from losing focus
    if (mosque) {
      router.push(`/mosque/${mosque.id}`);  // Directly navigate to the mosque page
    } else {
      Alert.alert('Error', 'Unable to view mosque profile.');
    }
  };

  const handleFocus = () => {
    setIsFocused(true);

    // Shrink the search bar to make space for the back arrow
    Animated.timing(inputWidth, {
      toValue: screenWidth * 0.85, // Shrink to 85% of the screen width
      duration: 200,
      useNativeDriver: false,
    }).start();

    // Show the back arrow with fade-in
    Animated.timing(arrowOpacity, {
      toValue: 1, // Fully visible
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);

    // Expand the search bar back to full width
    Animated.timing(inputWidth, {
      toValue: screenWidth - 20, // Full width again
      duration: 200,
      useNativeDriver: false,
    }).start();

    // Hide the back arrow with fade-out
    Animated.timing(arrowOpacity, {
      toValue: 0, // Fully hidden
      duration: 200,
      useNativeDriver: true,
    }).start();

    setSearch(''); // Clear search
  };

  const handleBackPress = () => {
    // Simulate blur by calling handleBlur and actually blur the input
    if (searchInputRef.current) {
      searchInputRef.current.blur(); // Force the search input to lose focus
    }
    handleBlur(); // Call the blur logic
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="px-4 mt-8 flex-row items-center">
        {/* Back Arrow with Fade-in/out */}
        <Animated.View style={{ opacity: arrowOpacity, position: 'absolute', left: 10 }}>
          <TouchableOpacity onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>

        {/* Animated Search Bar */}
        <Animated.View style={{ width: inputWidth, marginLeft: isFocused ? 30 : 0 }}>
          <NewSearchInput 
            ref={searchInputRef}  // Attach ref to the search input
            query={search}
            setQuery={setSearch}
            onFocus={handleFocus}  // Pass handleFocus to NewSearchInput
            // onBlur={handleBlur}    // Pass handleBlur to NewSearchInput
          />
        </Animated.View>
      </View>

      {/* Conditionally render events or mosques based on isFocused */}
      {isFocused ? (
        <FlatList
          data={filteredMosques}
          keyExtractor={(item) => item.mosque_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleMosquePress(item)}
              className="bg-black-100 p-4 m-2 rounded-lg"
            >
              <Text className="text-white text-lg font-psemibold">Mosque: {item.mosque_id}</Text>
              <Text className="text-gray-300 mt-1">Distance: {item.distance_miles} miles</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center mt-10">
              <Text className="text-white text-lg">No nearby mosques found</Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={nearbyEvents}
          keyExtractor={(item) => item.event_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/event/${item.event_id}`)}
              className="bg-black-100 p-4 m-2 rounded-lg"
            >
              <Text className="text-white text-lg font-psemibold">Event: {item.title}</Text>
              <Text className="text-gray-300 mt-1">Date: {item.date}</Text>
            </TouchableOpacity>
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
