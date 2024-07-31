import React from 'react';
import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

const WelcomeScreen = () => {
    const router = useRouter();

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Welcome to Masjidy</Text>
            <Button
                title="Sign Up/Sign In"
                onPress={() => router.push('/sign-in')} // Ensure the path is correct
            />
            <Button
                title="Skip Sign-In"
                onPress={() => router.push('/home')} // Ensure the path is correct
            />
        </View>
    );
};

export default WelcomeScreen;