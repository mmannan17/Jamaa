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
import * as ImageManipulator from 'expo-image-manipulator';

const create = () => {
    const [uploading, setUploading] = useState(false)
    const { createPost, user } = useContext(Context);

    const [form, setForm] = useState({
        title: '',
        media: null,
        content: '',
        postType: 'media',
        media_file: null,
    })

    const handleSubmit = async () => {
        setUploading(true);
        try {
            let mediaFile = null;
            if (form.media) {
                mediaFile = {
                    file_name: form.media.uri ? form.media.uri.split('/').pop() : 'image.png',
                    file_type: form.media.type || 'image/png',
                    media: form.media
                };
            }
            const postData = {
                mosque: user.mosque.mosque_id,
                title: form.title, 
                content: form.content,
                postType: form.postType,
                media_file: mediaFile,
            };

            await createPost(postData);
            
            // Clear form or navigate away
            setForm({ title: '', media: null, content: '', postType: 'post' });
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
            allowsEditing: true,
            aspect: [16, 9],
            quality: 1,
            videoMaxDuration: 60, // Limit video duration to 60 seconds
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            let manipulatedMedia = asset;

            if (asset.type === 'image') {
                // For images, manipulate as before
                manipulatedMedia = await ImageManipulator.manipulateAsync(
                    asset.uri,
                    [{ resize: { width: 1080 } }],
                    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                );
            } else if (asset.type === 'video') {
                // For videos, we don't manipulate but you might want to add video compression here
                // This would require a third-party library or native module
                console.log('Video selected:', asset.uri);
            }

            setForm({
                ...form,
                media: {
                    ...asset,
                    uri: manipulatedMedia.uri,
                    width: manipulatedMedia.width,
                    height: manipulatedMedia.height,
                    type: asset.type, // Explicitly set the type
                },
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
                title="Description (optional)"
                value={form.content}
                placeholder="Description"
                handleChangeText={(e) => setForm({...form, content: e})}
                otherStyles="mt-5"
                />

                <Dropdown
                    title="Post Type"
                    value={form.postType}
                    placeholder="Select Post Type"
                    options={[
                        { label: 'Post', value: 'media' },
                        { label: 'Event', value: 'event' },
                    ]}
                    handleChangeText={(value) => setForm({...form, postType: value})}
                />

                <View className="mt-7 space-y-2">
                    <Text className="text-base text-gray-100 font-pmedium">Upload Media (optional)</Text>
                    <TouchableOpacity onPress={() => openPicker()}>
    {form.media ? (
        form.media.type.startsWith('image') ? (
            <Image 
                source={{ uri: form.media.uri }} 
                className="w-full h-64 rounded-2xl"
                resizeMode="cover"  // Changed from "contain" to "cover"
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
