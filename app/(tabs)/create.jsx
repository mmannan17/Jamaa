import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../../components/FormField';
import { Video, ResizeMode } from 'expo-av';
import { icons } from '../../constants';
import CustomButton from '../../components/CustomButton';
import * as ImagePicker from 'expo-image-picker';
import Dropdown from '../../components/DropDown';

const create = () => {
    const [uploading, setUploading] = useState(false)
    const [form, setForm] = useState({
        title: '',
        posttype: '',
        media: null,
        content: '',
    })

    const submit = async () => {
      console.log(form)
    }

    const openPicker = async () => {
      let result;
  
      // Launch the appropriate picker based on media type
      result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All, // Allows both images and videos
          allowsEditing: true,
          quality: 1,
      });
  
      // Handle the selected media
      if (!result.canceled) {
          setForm({
              ...form,
              media: result.assets[0], // Save the selected media to form.media
          });
        }
      // } else {
      //     setTimeout(() => {
      //         Alert.alert("No media selected", JSON.stringify(result, null, 2));
      //     }, 100);
      // }
  };

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
        handleChangeText={(e) => setForm({...form, description: e})}
        otherStyles="mt-5"
        />

        {/* <Dropdown
        title="Post Type"
        value={form.posttype}
        options={[
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
          { label: 'Announcement', value: 'announcement' },
        ]}
        placeholder="Placeholder"
        handleChangeText={(e) => setForm({...form, postType: e})}
        otherStyles="mt-5"
        /> */}

        <View className="mt-7 space-y-2">
            <Text className="text-base text-gray-100 font-pmedium">Upload Media (optional)</Text>
            <TouchableOpacity onPress={() => openPicker()}>
    {form.media ? (
        form.media.type.startsWith('image') ? (
            <Image 
                source={{ uri: form.media.uri }} 
                className="w-full h-64 rounded-2xl" 
                resizeMode="contain" 
            />
        ) : (
            <Video 
                source={{ uri: form.media.uri }}
                className="w-full h-64 rounded-2xl"
                useNativeControls
                resizeMode="cover"
                isLooping
            />
        )
    ) : (
        <View className="w-full h-40 px-4 bg-black-100 rounded-2xl justify-center items-center">
            <View className="w-14 h-14 border border-dashed border-secondary-100 justify-center items-center">
                <Image 
                    source={icons.upload} 
                    className="w-1/2 h-1/2"
                    resizeMode="contain"
                />
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
