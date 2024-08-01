import { View, Text, FlatList, Image, RefreshControl } from 'react-native'
import React, { useState, useEffect, useContext } from 'react'
import {SafeAreaView} from 'react-native-safe-area-context'
import {images} from '../../constants'
import SearchInput from '../../components/SearchInput'
import Trending from '../../components/Trending'
import EmptyState from '../../components/EmptyState'
import { getAllPosts, getLatestPosts } from '../../apiRequests'
import { Context } from '../../components/globalContext'

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useContext(Context);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    await fetchLatestPosts();
    setRefreshing(false);
  }


  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList 
      data = {posts}
      keyExtractor = {(item) => item.id.toString()}
      renderItem={({item}) => (
        <Text className="text-3xl text-white">{item.post_id}</Text>
      )}
      ListHeaderComponent={()=>(
        <View className="flex mt-6 px-4 space-y-6">
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

          <View className="w-full flex-1 pt-5 pb-8">
            <Text className="text-lg font-pregular text-gray-100 mb-3">
              Latest Videos
            </Text>

            <Trending posts={latestPosts} />

          </View>
        </View>
      )}
      ListEmptyComponent={() => (
        <EmptyState
        title="No Videos Found"
        subtitle="Be the first to upload a post!"
        />
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}
      />
    </SafeAreaView>
  )
}

export default Home