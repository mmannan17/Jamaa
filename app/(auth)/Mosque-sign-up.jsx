import { View, Text, ScrollView, Image } from 'react-native';
import React, { useContext, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../../constants';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { Link, useNavigation } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Context } from '../../components/globalContext';
const SignUp = () => {

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    address: ''
  });
  const [ registerUser ] = useContext(Context)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  const submit = async () => {
    setIsSubmitting(true);
    setError(null);

    if (!form.username || !form.email || !form.password || !form.address) {
      setError("Please fill in all fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const userData = {
        username: form.username,
        email: form.email,
        password: form.password,
        address: form.address,
        role: "mosque"
      };
      const response = await registerUser(userData);
      navigation.navigate('sign-in');
      console.log('User registered successfully:', response);
    } catch (error) {
      console.error('Error registering user:', error);
      setError("An error occurred during registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <View className="w-full justify-center min-h-[15vh] px-4 my-6">
          <View className="w-full flex items-end">
            <Image source={images.testLogoSmall} resizeMode='contain' className="w-[115px] h-[80px]" />
          </View>
          <Text className="text-2xl text-white font-psemibold">Register Your Masjid</Text>

          {error && (
            <Text className="text-red-500 mt-2 text-left text-base">{error}</Text>
          )}

          <FormField
            title="Mosque Name"
            value={form.username}
            handleChangeText={(e) => setForm({ ...form, username: e })}
            otherStyles="mt-10"
            placeholder="Enter Mosque Name"
          />

          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-5"
            keyboardType="email-address"
            placeholder="Enter Email for Login"
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-5"
            secureTextEntry={true}
            placeholder="Enter Password"
          />

          <FormField
            title="Mosque Address"
            value={form.address}
            handleChangeText={(e) => setForm({ ...form, address: e })}
            otherStyles="mt-5"
            placeholder="Enter Address"
          />

          <CustomButton
            title="Sign Up"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />

          <View className="justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-100 font-pregular">
              Have an account Already?
            </Text>
            <Link href="/sign-in" className="text-lg font-psemibold text-secondary">Sign in</Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;
