import { View, Text, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'

const PostCard = ({post: {posttype, content, media_file, timestamp, mosque, media_type}}) => {
    const [play, setPlay] = useState(false)
    const date = new Date(timestamp);
    const formattedDate = date.toISOString().split('T')[0];

  return (
    <View className="flex-col item-center px-4 mb-8">
        <View className="flex flex-row gap-3 items-center">
        <View className="flex justify-center items-center flex-row flex-1">
          <View className="w-[46px] h-[46px] rounded-lg border border-secondary flex justify-center items-center p-0.5">
            {/* Profile Pic */}
            <Image
              source={{ uri: media_file }}
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          </View>

          <View className="flex justify-center flex-1 ml-3 gap-y-1">
            <Text
              className="font-psemibold text-sm text-white"
              numberOfLines={1}>
              {posttype}
            </Text>
            <Text className="text-xs text-gray-100 font-pregular" numberOfLines={1}>
                {mosque}
            </Text>
            </View>
        </View>

        <View className="flex-1 items-end">
            <Text className="text-xs text-gray-100 font-pregular" numberOfLines={1}>
                {formattedDate}
            </Text>
        </View>
    </View>
    {media_type === 'video' ? (
                play ? (
                    <Video
                        source={{ uri: media_file }}
                        className="w-full h-60 rounded-xl mt-3"
                        resizeMode={ResizeMode.CONTAIN}
                        useNativeControls
                        shouldPlay
                        onPlaybackStatusUpdate={(status) => {
                            if (status.didJustFinish) {
                                setPlay(false);
                            }
                        }}
                    />
                ) : (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setPlay(true)}
                        className="w-full h-60 rounded-xl mt-3 relative flex justify-center items-center"
                    >
                        <Image
                            source={{ uri: media_file }}
                            className="w-full h-full rounded-xl mt-3"
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                )
            ) : (
                <Image
                    source={{ uri: media_file }}
                    className="w-full h-60 rounded-xl mt-3"
                    resizeMode="cover"
                />
            )}
    </View>
  )
}

export default PostCard;