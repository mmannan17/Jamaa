import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import React, { useContext, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../../components/FormField';
import { Video, ResizeMode } from 'expo-av';
import { icons } from '../../constants';
import CustomButton from '../../components/CustomButton';
import * as ImagePicker from 'expo-image-picker';
import Dropdown from '../../components/DropDown';
import { Context } from '../../components/globalContext';

const create = () => {
    const [uploading, setUploading] = useState(false)
    const { createPost, user } = useContext(Context);

    const [form, setForm] = useState({
        title: '',
        media: null,
        content: '',
    })

    const handleSubmit = async () => {
        setUploading(true);
        try {
            const postData = {
                mosque: user.mosque.mosque_id,
                posttype: form.title, 
                content: form.content,
                media_file: form.media ? form.media : null,
            };

            console.log('Submitting post data...');
            const result = await createPost(postData);
            console.log('Post created successfully');
            // Clear form or navigate away
            setForm({ title: '', media: null, content: '' });
            Alert.alert('Success', 'Post created successfully!');
        } catch (error) {
            console.error('Error creating post:', error);
            Alert.alert('Error', 'Failed to create post. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const openPicker = async () => {
  
      const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All, 
          allowsEditing: false,
          quality: 1,
      });
  
      if (!result.canceled) {
          setForm({
              ...form,
              media: result.assets[0], // Save the selected media to form.media
          });
        }
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
        value={form.content}
        placeholder="Description"
        handleChangeText={(e) => setForm({...form, content: e})}
        otherStyles="mt-5"
        />

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
        handlePress={handleSubmit}
        containerStyles="mt-7"
        isLoading={uploading}
        />

      </ScrollView>
    </SafeAreaView>
  )
}

export default create
