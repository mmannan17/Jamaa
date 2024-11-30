import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Alert, Modal } from 'react-native';
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
  const { user, mosquePosts, getMosquePosts, logout, profile_pic, deletePost, fetchPrayerTimes } = useContext(Context);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // State for tab management
  const router = useRouter();

  useEffect(() => {
    const fetchMosquePosts = async () => {
      if (user && user.mosque && user.mosque.mosquename && user.role === 'mosque') {
        await getMosquePosts(user.mosque.mosquename);
      }
      setIsLoading(false);
    };
    const loadPrayerTimes = async () => {
      if (user && user.mosque && user.mosque.mosque_id) {
        const data = await fetchPrayerTimes(user.mosque.mosque_id);
        if (data) {
          setPrayerTimes(data);
        }
      }
    };

    fetchMosquePosts();
    loadPrayerTimes();
  }, [user]);

  const openMenu = (postId) => {
    setSelectedPostId(postId);
    setModalVisible(true);
  };

  const handleDeletePost = async () => {
    if (selectedPostId) {
      const success = await deletePost(selectedPostId);
      if (success) {
        if (user && user.mosque && user.mosque.mosquename) {
          await getMosquePosts(user.mosque.mosquename);
        }
      } else {
        Alert.alert('Error', 'Failed to delete the post. Please try again.');
      }
    }
    setModalVisible(false);
  };

  const renderTabContent = () => {
    if (activeTab === 'posts') {
      return (
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-white">Your Saved Posts</Text>
          {/* Replace this with actual saved posts content */}
        </View>
      );
    }
    if (activeTab === 'events') {
      return (
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-white">Your Saved Events</Text>
          {/* Replace this with actual saved events content */}
        </View>
      );
    }
  };

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
                <Image source={icons.menu} className="w-6 h-6" resizeMode="contain" />
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
                  source={{
                    uri: profile_pic || 'https://ohsobserver.com/wp-content/uploads/2022/12/Guest-user.png',
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              <Text className="text-xl font-psemibold text-white mb-4">{user ? user.username : 'User'}</Text>

              <View className="flex-row justify-center w-full mb-4">
                <CustomButton
                  title="Edit Profile"
                  handlePress={() => router.push('/edit/editMosque')}
                  containerStyles="min-h-[45px] flex-1 mr-2 bg-secondary"
                  textStyles="text-base"
                />
                <CustomButton
                  title="Edit Prayer Times"
                  handlePress={() => router.push('/edit/prayerTimes')}
                  containerStyles="min-h-[45px] flex-1 ml-2 bg-secondary"
                  textStyles="text-base"
                />
              </View>

              <View className="w-full mt-6">
                {prayerTimes ? (
                  <TimeTable
                    mosque={{
                      name: user.mosque.mosquename,
                      fajr: prayerTimes.Fajr,
                      dhuhr: prayerTimes.Zuhr,
                      asr: prayerTimes.Asr,
                      maghrib: prayerTimes.Maghrib,
                      isha: prayerTimes.Isha,
                    }}
                  />
                ) : (
                  <Text className="text-white text-center text-xl font-psemibold">
                    Loading prayer times...
                  </Text>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <EmptyState title="No Posts Found" subtitle="You haven't created any posts yet" />
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
        <View className="flex-1">
          {/* Header Section */}
          <View className="w-full items-center mt-6 mb-4 px-4">
            <TouchableOpacity
              className="w-full items-end mb-4"
              onPress={() => router.push('/edit/settings')}
            >
              <Feather name="settings" size={28} color="white" />
            </TouchableOpacity>

            <View className="w-32 h-32 border-2 border-secondary rounded-full justify-center items-center overflow-hidden mb-4">
              <Image
                source={{
                  uri: profile_pic || 'https://ohsobserver.com/wp-content/uploads/2022/12/Guest-user.png',
                }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>

            <Text className="text-xl font-psemibold text-white mb-4">
              {user ? user.username : 'User'}
            </Text>
  
            <View className="flex-row justify-center w-full space-x-4 px-4">
              
              <CustomButton
                title="Followed Mosques"
                handlePress={() => router.push('/edit/followingScreen')}
                containerStyles="min-h-[50px] bg-secondary flex-1"
                textStyles="text-base"
              />
            </View>

          </View>

          {/* Tab Section */}
          <View className="flex-row justify-around items-center w-full">
            <TouchableOpacity
              className="flex-1 items-center py-4"
              onPress={() => setActiveTab('posts')}
            >
              <View className="items-center">
                <Feather
                  name="bookmark"
                  size={24}
                  color={activeTab === 'posts' ? '#FFA001' : '#CDCDE0'}
                />
                <Text
                  className={`text-sm ${
                    activeTab === 'posts' ? 'text-secondary' : 'text-white'
                  }`}
                >
                  Saved Posts
                </Text>
                {activeTab === 'posts' && (
                  <View className="w-12 h-1 bg-secondary mt-2 rounded" />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 items-center py-4"
              onPress={() => setActiveTab('events')}
            >
              <View className="items-center">
                <Feather
                  name="calendar"
                  size={24}
                  color={activeTab === 'events' ? '#FFA001' : '#CDCDE0'}
                />
                <Text
                  className={`text-sm ${
                    activeTab === 'events' ? 'text-secondary' : 'text-white'
                  }`}
                >
                  Saved Events
                </Text>
                {activeTab === 'events' && (
                  <View className="w-12 h-1 bg-secondary mt-2 rounded" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          <View className="flex-1 px-4">{renderTabContent()}</View>
        </View>
      </SafeAreaView>
    );
  }
};

export default Profile;
