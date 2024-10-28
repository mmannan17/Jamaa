import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Linking, Platform, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Context } from '../../components/globalContext';
import EmptyState from '../../components/EmptyState';
import ProfilePostCard from '../../components/ProfilePostCard';
import { icons } from '../../constants';
import CustomButton from '../../components/CustomButton';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import TimeTable from '../../components/TimeTable';

const Profile = () => {
  const { user, mosquePosts, getMosquePosts, logout, profile_pic, deletePost } = useContext(Context);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const router = useRouter(); 


  useEffect(() => {
    const fetchMosquePosts = async () => {
      if (user && user.mosque && user.mosque.mosquename && user.role === 'mosque') {
        await getMosquePosts(user.mosque.mosquename);
      }
      setIsLoading(false);
    };
  
    fetchMosquePosts();
  }, [user]);

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

  const openMenu = (postId) => {
    setSelectedPostId(postId);
    setModalVisible(true);
  };

  const handleDeletePost = async () => {
    if (selectedPostId) {
      const success = await deletePost(selectedPostId);
      if (success) {
        // Refresh the posts
        if (user && user.mosque && user.mosque.mosquename) {
          await getMosquePosts(user.mosque.mosquename);
        }
      } else {
        // Handle deletion failure
        Alert.alert('Error', 'Failed to delete the post. Please try again.');
      }
    }
    setModalVisible(false);
  };


  const hasAddress = user?.mosque?.address;
  const hasEmail = user?.mosque?.email;

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <Text className="font-psemibold text-white text-2xl">Loading...</Text>
      </View>
    );
  }

  if (user && user.role === 'mosque') {
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
              <TouchableOpacity
                className="w-full items-end mb-4"
                onPress={() => router.push('/edit/settings')}
              >
                <Feather name="settings" size={28} color="white" />
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
              {/* Edit Profile Button for Mosques */}
              <CustomButton
                title="Edit Profile"
                handlePress={() => {
                  // Add logic to navigate to the edit profile screen
                  router.push('/edit/editMosque'); // Replace with your actual edit profile route
                }}
                containerStyles="min-h-[45px] w-2/4 mb-4 bg-secondary"
                textStyles="text-base"
              />
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
              <View className="w-full mt-6">
                <TimeTable 
                  mosque={{
                    name: user.mosque.mosquename,
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
            <EmptyState
              title="No Posts Found"
              subtitle="You haven't created any posts yet"
            />
          )}
        />
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
            <View className="bg-primary p-5 rounded-lg w-4/5">
              <Text className="text-white text-lg mb-4">Delete this post?</Text>
              <View className="flex-row justify-between">
                <CustomButton
                  title="Cancel"
                  handlePress={() => setModalVisible(false)}
                  containerStyles="flex-1 mr-2"
                />
                <CustomButton
                  title="Delete"
                  handlePress={handleDeletePost}
                  containerStyles="flex-1 ml-2 bg-red-500"
                />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  } else if (user && user.role === 'user') {
    return (
      <SafeAreaView className="bg-primary h-full">
        <View className="flex-1 items-center">
          <View className="w-full items-center mt-6 mb-12 px-4">
          <TouchableOpacity
            className="w-full items-end mb-4"
            onPress={() => router.push('/edit/settings')} // Replace '/settings' with your actual settings route if different
          >
            <Feather name="settings" size={28} color="white" />
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
  
          <View className="flex-row justify-center w-full space-x-4 px-4">
            <CustomButton
                title="Edit Profile"
                handlePress={() => {
                  // Add logic to navigate to or open the edit profile screen/modal
                }}
                containerStyles="min-h-[50px] bg-secondary flex-1 mr-4"
                textStyles="text-base"
              />
            <CustomButton
              title="Followed Mosques"
              handlePress={() => {
                // Add logic to navigate to the followed mosques list
              }}
              containerStyles="min-h-[50px] bg-secondary flex-1"
              textStyles="text-base"
            />
  
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
};

export default Profile;
