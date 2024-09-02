import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Linking, Platform, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Context } from '../../components/globalContext';
import EmptyState from '../../components/EmptyState';
import PostCard from '../../components/postCard';
import { icons } from '../../constants';
import CustomButton from '../../components/CustomButton';

const MosqueProfile = () => {
  const { id } = useLocalSearchParams();
  const { mosques, getMosquePosts } = useContext(Context);
  const [isLoading, setIsLoading] = useState(true);
  const mosque = mosques.find(m => m.id.toString() === id.toString());

  useEffect(() => {
    const fetchMosquePosts = async () => {
      if (mosque && mosque.mosque && mosque.mosque.mosque_id) {
        await getMosquePosts(mosque.mosque.mosque_id);
      }
      setIsLoading(false);
    };

    fetchMosquePosts();
  }, [mosque]);

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
      <FlatList
        data={mosque.mosque ? mosque.mosque.posts : []}
        keyExtractor={(item) => item.post_id.toString()}
        renderItem={({item}) => (
          <PostCard post={item}/>
        )}
        ListHeaderComponent={() => (
          <View className="w-full items-center mt-6 mb-12 px-4">
            <View className="w-32 h-32 border-2 border-secondary rounded-full justify-center items-center overflow-hidden mb-4">
              <Image
                source={{uri: mosque.profile_pic || 'https://ohsobserver.com/wp-content/uploads/2022/12/Guest-user.png'}}
                className="w-full h-full"
                resizeMode='cover'/>
            </View>
            
            <Text className="text-xl font-psemibold text-white mb-4">
              {mosque.username}
            </Text>

            <View className="flex-row justify-center w-full">
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