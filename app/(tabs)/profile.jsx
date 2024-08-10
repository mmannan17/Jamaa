import { View, Text, FlatList, Image, TouchableOpacity} from 'react-native'
import React, { useContext, useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Context } from '../../components/globalContext';
import EmptyState from '../../components/EmptyState';
import PostCard from '../../components/postCard';
import { icons } from '../../constants';
import InfoBox from '../../components/InfoBox';


const Profile = () => {
  const { user, mosquePosts, getMosquePosts, logout, profile_pic } = useContext(Context);

  useEffect(() => {
    if (user && user.mosque && user.mosque.mosque_id) {
      getMosquePosts(user.mosque.mosque_id); 
    }
  }, [user]);

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
      data={mosquePosts}
      keyExtractor = {(item) => item.post_id.toString()}
      renderItem={({item}) => (
        <PostCard post={item}/>
      )} 
      ListHeaderComponent={()=>(
        <View className="w-full justify-center items-center mt-6 mb-12 px-4">
          <TouchableOpacity className="w-full items-end" onPress={logout}>
            <Image
              source={icons.logout}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View className="w-16 h-16 border border-secondary rounded-lg justify-center items-center">
            <Image
              source={{uri: profile_pic? media_file: 'https://ohsobserver.com/wp-content/uploads/2022/12/Guest-user.png'}}
              className="w-[90%] h-[90%] rounded-lg"
              resizeMode='cover'/>
          </View>
          
          <InfoBox
          title={user ? user.username : 'User'}
          containterStyles="mt-5"
          textStyles="text-lg"
           />

           <View className="flex-row">
            <InfoBox
            title={mosquePosts.length || 0}
            subtitle="Posts"
            containterStyles="mt-5"
            textStyles="text-lg"
            />
           </View>


        </View>   
      )}
      ListEmptyComponent={() => (
        <EmptyState
        title="No Videos Found"
        subtitle="Mosques has not created any posts yet"
        />
      )}

      />
    </SafeAreaView>
  );
};

export default Profile;