import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Linking, Platform, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Context } from '../../components/globalContext';
import EmptyState from '../../components/EmptyState';
import PostCard from '../../components/postCard';
import { icons } from '../../constants';
import CustomButton from '../../components/CustomButton';
import { useRouter } from 'expo-router';
import TimeTable from '../../components/TimeTable';

const MosqueProfile = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { mosques, getMosquePosts, mosquePosts, followMosque, unfollowMosque } = useContext(Context);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const mosque = mosques.find(m => m.mosque.mosque_id.toString() === id.toString());

  useEffect(() => {
    console.log(mosque)
    const fetchMosquePosts = async () => {
      if (mosque && mosque.mosque && mosque.mosque.mosquename) {
        await getMosquePosts(mosque.mosque.mosquename);
      }
      setIsLoading(false);
    };

    fetchMosquePosts();
  }, [mosque]);

  const toggleFollow = async () => {
    try {
      if (isFollowing) {
        const success = await unfollowMosque(mosque.mosque.mosque_id);
        if (success) {
          setIsFollowing(false);
        }
      } else {
        const success = await followMosque(mosque.mosque.mosque_id);
        if (success) {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Unable to update follow status.");
    }
  };

  const openMap = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const url = Platform.select({
      ios: `${scheme}${encodedAddress}`,
      android: `${scheme}${encodedAddress}`
    });

    Linking.openURL(url).catch((err) => {
      Alert.alert('Error', 'Unable to open map application.');
    });
  };

  const openEmail = (email) => {
    Linking.openURL(`mailto:${email}`).catch((err) => {
      Alert.alert('Error', 'Unable to open email application.');
    });
  };

  if (isLoading) {
    return <View className="flex-1 justify-center items-center bg-primary"><Text className="font-psemibold text-white text-2xl">Loading...</Text></View>;
  }

  if (!mosque) {
    return <View className="flex-1 justify-center items-center bg-primary"><Text className="font-psemibold text-white text-2xl">Mosque not found</Text></View>;
  }

  const hasAddress = mosque.mosque && mosque.mosque.address;
  const hasEmail = mosque.mosque && mosque.mosque.email;

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
      <FlatList
        data={mosquePosts}
        keyExtractor={(item) => item.post_id.toString()}
        renderItem={({item}) => (
          <PostCard post={item}/>
        )}
        ListHeaderComponent={() => (
          <View className="w-full items-center mt-2 mb-12 px-4">
            <View className="w-32 h-32 border-2 border-secondary rounded-full justify-center items-center overflow-hidden mb-4">
              <Image
                source={{uri: mosque.profile_pic || 'https://ohsobserver.com/wp-content/uploads/2022/12/Guest-user.png'}}
                className="w-full h-full"
                resizeMode='cover'/>
            </View>
            
            <Text className="text-xl font-psemibold text-white mb-4">
              {mosque.mosque.mosquename}
            </Text>

            <View className="flex-row justify-center w-full">
              <CustomButton
                  title={isFollowing ? "Following" : "Follow"}
                  handlePress={toggleFollow}
                  containerStyles={`min-h-[45px] flex-1 mr-2 ${isFollowing ? 'bg-primary border border-[#FFA500]' : 'bg-[#FFA500]'}`}
                  textStyles={isFollowing ? 'text-white' : 'text-black'}
                />
              {hasAddress && (
                <CustomButton
                  title="Directions"
                  handlePress={() => openMap(mosque.mosque.address)}
                  containerStyles={`min-h-[45px] ${hasEmail ? 'flex-1 mr-2' : 'w-3/4'}`}
                  textStyles="text-base"
                />
              )}
              {hasEmail && (
                <CustomButton
                  title="Email"
                  handlePress={() => openEmail(mosque.mosque.email)}
                  containerStyles={`min-h-[45px] ${hasAddress ? 'flex-1 ml-2' : 'w-3/4'}`}
                  textStyles="text-base"
                />
              )}
            </View>

            <View className="w-full mt-6">
            <TimeTable 
                  mosque={{
                    fajr: '05:30',
                    sunrise: '06:00',
                    dhuhr: '13:15',
                    asr: '16:45',
                    maghrib: '19:30',
                    isha: '21:00',
                  }}
                />
            </View>
          </View>   
        )}
        ListEmptyComponent={() => (
          <Text className="text-white text-center text-xl font-psemibold">No Posts Found</Text>
        )}
      />
    </SafeAreaView>
  );
};

export default MosqueProfile;
