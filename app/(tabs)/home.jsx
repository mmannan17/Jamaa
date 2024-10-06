import { View, Text, FlatList, Image, RefreshControl } from 'react-native'
import React, { useState, useEffect, useContext, useMemo } from 'react'
import {SafeAreaView} from 'react-native-safe-area-context'
import {images} from '../../constants'
import SearchInput from '../../components/SearchInput'
import EmptyState from '../../components/EmptyState'
import { Context } from '../../components/globalContext'
import PostCard from '../../components/postCard'

const Home = () => {
  const { getPosts, user, allPosts, mosques, getMosques, getNearbyMosques } = useContext(Context);
  const [refreshing, setRefreshing] = useState(false)
  const [isFetched, setIsFetched] = useState(false); // Add a flag to keep track of whether the initial fetch has been done
  const MemoizedPostCard = React.memo(PostCard);

  const onRefresh = async () => {
    setRefreshing(true);
    await getPosts();
    await getMosques();
    console.log("refreshed");
    setRefreshing(false);
  };

  useEffect(() => {
    getPosts();
    getMosques();
    getNearbyMosques();
    onRefresh();
  }, []);

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList 
      data = {allPosts}
      keyExtractor = {(item) => item.post_id.toString()}
      renderItem={({item}) => (
        <MemoizedPostCard post={item}/>
      )}
      ListHeaderComponent={()=>(
        <View className="flex mt-6 px-4 space-y-2">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="font-pmedium text-sm text-gray-100">
                Salam
              </Text>
              <Text className="text-2xl font-psemibold text-white">
                {user ? user.username : 'User'}
              </Text>
            </View>
            
            <View className="mt-1.5">
              <Image 
                source={images.logoSmall}
                className="w-9 h-10"
                resizemode='contain'
                />
            </View>
          </View>

          <SearchInput/>

          <View className="w-full flex-1 ">
            {/* <Text className="text-xl font-psemibold text-gray-100 mb-3">
              Latest Posts
            </Text> */}

          </View>
        </View>
      )}
      ListEmptyComponent={() => (
        <EmptyState
        title="No Videos Found"
        subtitle="Be the first to upload a post!"
        />
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      getItemLayout={(data, index) => (
        {length: 200, offset: 200 * index, index}
      )}
      windowSize={5}
      />
    </SafeAreaView>
  )
}

export default Home