import { View, Text, ScrollView, Image } from 'react-native';
import React, {useState, useContext } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {images} from '../../constants';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { Link, useRouter } from 'expo-router';
import { Context } from '../../components/globalContext';


const SignIn = () => {
  const { login } = useContext(Context);
  const router = useRouter();

  const [form, setForm] = useState ({
  username: '',
  password: ''
})

const [isSubmitting, setisSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    console.log('submitting');
    setisSubmitting(true);
    setError(null);

    try {
      await login(form.username, form.password);
      router.replace('/home');
    } catch (err) {
      setError("Invalid username or password. Please try again.");
    }
    setisSubmitting(false);
  };

  return (
    <SafeAreaView className ="bg-primary h-full">
     <ScrollView>
      <View className="w-full justify-center min-h-[550] px-4 my-6 mt-10 ">
        <View className="flex-row items-center mb-[-27] space-x-2">
          <Text className="text-3xl text-white font-psemibold">Log in to Jamaa</Text>
          <Image source={images.testLogoSmall}
            resizeMode='contain' className="w-[115px] h-[80px]"/>
        </View>
        
        {error && (
          <Text className="text-red-500 mt-6 text-left text-base">{error}</Text>
        )}

        <FormField 
        title= "Username"
        value={form.username}
        handleChangeText ={(e) => setForm ({ ...form, username: e})}
        otherStyles="mt-7"
        keyboardType="username"
        placeholder="Enter Username"
        />

        <FormField 
        title= "Password"
        value={form.password}
        handleChangeText ={(e) => setForm ({ ...form, password: e})}
        otherStyles="mt-7"
        placeholder="Enter Password"
        />

        <CustomButton
        title ="Sign-in"
        handlePress={submit}
        containerStyles="mt-7"
        isLoading = {isSubmitting}
        />
        <View className="justify-center pt-5 flex-row gap-2 ">
          <Text className ="text-lg text-gray-100 font-pregular">
            Don't have an account?
          </Text>
          <Link href ="/userTypeSelection" className ="text-lg font-psemibold text-secondary">Sign Up</Link>
          
        </View>
      </View>
     </ScrollView>
    </SafeAreaView>
  )
}

export default SignIn