import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, View, Image } from 'react-native';
import {Link, Redirect, router} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import { images } from '../constants';
import CustomButton from '../components/CustomButton';
import { useContext } from 'react';
import { Context } from '../components/globalContext';

export default function LandingPage() {

  const {isLoggedIn} = useContext(Context);
  if(isLoggedIn) return <Redirect href='/home'/>

  return (
    <SafeAreaView className = 'bg-primary h-full'>
      <ScrollView contentContainerStyle = {{height: '100%'}}>
        <View className =" w-full  items-center min-h-[85vh] px-4 justify-center">
          <Image 
          source={images.testLogoSmall}
          className="max-w-[230px] w-full h-[300px]"
          resizeMode='contain'
          />
          {/* <View className = "relative mt-5">
            <Text className = "text-3xl text-white font-bold text-center"> Welcome to
            <Text className = "text-secondary-200"> Jamaa{"\n"}</Text>
            </Text>
          </View> */}

          <Text className="text-sm font-pregular text-white mt-7 text-center mb-5">Where you can stay connected with the Muslim Community</Text>
          
          <CustomButton
          title = "Sign Up/Sign In"
          handlePress ={() => router.push('/sign-in')} 
          containerStyles="w-full mt-7"/>

        </View>
      </ScrollView>
      <StatusBar backgroundColor='#161622' style='light'/>
    </SafeAreaView>  
    );
}

