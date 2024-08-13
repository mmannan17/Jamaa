import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../../components/FormField';
import { Video, ResizeMode } from 'expo-av';
import { icons } from '../../constants';
import CustomButton from '../../components/CustomButton';
import * as DocumentPicker from 'expo-document-picker';
import Dropdown from '../../components/DropDown';
// import TestDropDown from '../../components/TestDropDown';

const create = () => {
    const [uploading, setUploading] = useState(false)
    const [postType, setPostType] = useState('')
    const [form, setForm] = useState({
        title: '',
        postType: '',
        video: null,
        picture: null,
        description: '',
    })

    const submit = async () => {}

    const openPicker = async (selectType) => {
        const result = await DocumentPicker.getDocumentAsync({
          type:
            selectType === "image"
              ? ["image/png", "image/jpg"]
              : ["video/mp4", "video/gif"],
        });
    }

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView className="px-4 my-6">
        <Text className="text-2xl text-white font-psemibold">Create Post</Text>
        <FormField 
        title="Post Title"
        value={form.title}
        placeholder="Post Title"
        handleChangeText={(e) => setForm({...form, title: e})}
        otherStyles="mt-10"
        />

        <FormField 
        title="Description / Caption (optional)"
        value={form.description}
        placeholder="Description"
        handleChangeText={(e) => setForm({...form, title: e})}
        otherStyles="mt-5"
        />

        <Dropdown
        title="Post Type"
        value={form.postType}
        // options={['Video', 'Image', 'Text']}
        // placeholder="Post Type"r
        handleChangeText={(e) => setForm({...form, postType: e})}
        otherStyles="mt-5"
        />

        <View className="mt-7 space-y-2">
            <Text className="text-base text-gray-100 font-pmedium">Upload Video</Text>
            <TouchableOpacity onPress={() => openPicker('video')}>
                {form.video ? (
                    <Video 
                    source={form.video}
                    className="w-full h-64 roundeed-2xl"
                    useNativeControls
                    resizeMode={ResizeMode.COVER}
                    isLooping
                     />
                ) : (
                    <View className="w-full h-40  px-4 bg-black-100 rounded-2xl justify-center items-center">
                        <View className="w-14 h-14 border border-dashed border-secondary-100 justify-center items-center">
                            <Image 
                            source={icons.upload} 
                            className="w-1/2 h-1/2"
                            ResizeMode="contain"/>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
        {/* <View>
            
        </View> */}

        <CustomButton
        title="Submit & Share"
        handlePress={submit}
        containerStyles="mt-7"
        isLoading={uploading}
        />

      </ScrollView>
    </SafeAreaView>
  )
}

export default create
