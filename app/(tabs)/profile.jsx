import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Linking, Platform, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Context } from '../../components/globalContext';
import EmptyState from '../../components/EmptyState';
import ProfilePostCard from '../../components/ProfilePostCard';
import { icons } from '../../constants';
import CustomButton from '../../components/CustomButton';
const Profile = () => {
  const { user, mosquePosts, getMosquePosts, logout, profile_pic } = useContext(Context);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMosquePosts = async () => {
      if (user && user.mosque && user.mosque.mosquename && user.role === 'mosque') {
        await getMosquePosts(user.mosque.mosquename);
      }
      setIsLoading(false);
    };
  
    fetchMosquePosts();
  }, [user]);

  const hasAddress = user?.mosque?.address;
  const hasEmail = user?.mosque?.email;

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <Text className="font-psemibold text-white text-2xl">Loading...</Text>
      </View>
    );
  }

  if (user.role === 'mosque') {
    return (
      <SafeAreaView className="bg-primary h-full">
        <FlatList
          data={mosquePosts}
          keyExtractor={(item) => item.post_id.toString()}
          renderItem={({ item }) => (
            <View>
              <ProfilePostCard post={item} />
              <TouchableOpacity 
                onPress={() => openMenu(item.post_id)}
                className="absolute top-2 right-2 p-2"
              >
                <Image
                  source={icons.menu}
                  className="w-6 h-6"
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          )}
          ListHeaderComponent={() => (
            <View className="w-full items-center mt-6 mb-12 px-4">
              <TouchableOpacity className="w-full items-end mb-4" onPress={logout}>
                <Image
                  source={icons.logout}
                  className="w-6 h-6"
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <View className="w-32 h-32 border-2 border-secondary rounded-full justify-center items-center overflow-hidden mb-4">
                <Image
                  source={{ uri: profile_pic || 'https://ohsobserver.com/wp-content/uploads/2022/12/Guest-user.png' }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              
              <Text className="text-xl font-psemibold text-white mb-4">
                {user ? user.username : 'User'}
              </Text>

              <View className="flex-row justify-center w-full">
                {hasAddress && (
                  <CustomButton
                    title="Directions"
                    handlePress={() => openMap(user.mosque.address)}
                    containerStyles={`min-h-[45px] ${hasEmail ? 'flex-1 mr-2' : 'w-3/4'}`}
                    textStyles="text-base"
                  />
                )}
                {hasEmail && (
                  <CustomButton
                    title="Email"
                    handlePress={() => openEmail(user.mosque.email)}
                    containerStyles={`min-h-[45px] ${hasAddress ? 'flex-1 ml-2' : 'w-3/4'}`}
                    textStyles="text-base"
                  />
                )}
              </View>
            </View>   
          )}
          ListEmptyComponent={() => (
            <EmptyState
              title="No Posts Found"
              subtitle="You haven't created any posts yet"
            />
          )}
        />
      </SafeAreaView>
    );
  } else {
    return (
      <SafeAreaView className="bg-primary h-full">
        <View className="flex-1 items-center">
          <View className="w-full items-center mt-6 mb-12 px-4">
            <TouchableOpacity className="w-full items-end mb-4" onPress={logout}>
              <Image
                source={icons.logout}
                className="w-6 h-6"
                resizeMode="contain"
              />
            </TouchableOpacity>

            <View className="w-32 h-32 border-2 border-secondary rounded-full justify-center items-center overflow-hidden mb-4">
              <Image
                source={{ uri: profile_pic || 'https://ohsobserver.com/wp-content/uploads/2022/12/Guest-user.png' }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            
            <Text className="text-xl font-psemibold text-white mb-4">
              {user ? user.username : 'User'}
            </Text>

            <View className="flex-row justify-center w-full">
              {hasAddress && (
                <CustomButton
                  title="Directions"
                  handlePress={() => openMap(user.mosque.address)}
                  containerStyles={`min-h-[45px] ${hasEmail ? 'flex-1 mr-2' : 'w-3/4'}`}
                  textStyles="text-base"
                />
              )}
              {hasEmail && (
                <CustomButton
                  title="Email"
                  handlePress={() => openEmail(user.mosque.email)}
                  containerStyles={`min-h-[45px] ${hasAddress ? 'flex-1 ml-2' : 'w-3/4'}`}
                  textStyles="text-base"
                />
              )}
            </View>
          </View>

          <CustomButton
            title="View Followed Mosques"
            handlePress={() => {/* Add logic to navigate to the followed mosques list */}}
            containerStyles="min-h-[50px] bg-secondary"
            textStyles="text-base"
          />
        </View>
      </SafeAreaView>
    );
  }
};

export default Profile;
