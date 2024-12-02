import { View, Text, Image } from 'react-native';
import { Tabs } from 'expo-router';
import { icons } from '../../constants';
import { StatusBar } from 'expo-status-bar';

const TabsLayout = () => {
  return (
    <>
      <StatusBar backgroundColor='#161622' style='light'/>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#161622',
            borderTopWidth: 1,
            borderTopColor: '#232533',
            height: 95,
            paddingBottom: 10,
            paddingTop: 5,
            position: 'absolute',
            bottom: 0,
          },
          tabBarActiveTintColor: '#FFA001',
          tabBarInactiveTintColor: '#CDCDE0',
        }}
      >
        <Tabs.Screen 
          name="home"
          options={{
            tabBarLabel: ({ focused }) => (
              <Text className={`${focused ? 'font-psemibold' : 'font-pregular'} text-xs text-white mt-2`}>
                Home
              </Text>
            ),
            tabBarIcon: ({ color }) => (
              <Image 
                source={icons.home}
                style={{ width: 24, height: 24, tintColor: color }}
                resizeMode="contain"
              />
            ),
          }}
        />

        <Tabs.Screen 
          name="explore"
          options={{
            tabBarLabel: ({ focused }) => (
              <Text className={`${focused ? 'font-psemibold' : 'font-pregular'} text-xs text-white mt-2`}>
                Explore
              </Text>
            ),
            tabBarIcon: ({ color }) => (
              <Image 
                source={icons.search}
                style={{ width: 24, height: 24, tintColor: color }}
                resizeMode="contain"
              />
            ),
          }}
        />

        <Tabs.Screen 
          name="create"
          options={{
            tabBarLabel: ({ focused }) => (
              <Text className={`${focused ? 'font-psemibold' : 'font-pregular'} text-xs text-white mt-2`}>
                Create
              </Text>
            ),
            tabBarIcon: ({ color }) => (
              <Image 
                source={icons.plus}
                style={{ width: 24, height: 24, tintColor: color }}
                resizeMode="contain"
              />
            ),
          }}
        />

        <Tabs.Screen 
          name="bookmark"
          options={{
            tabBarLabel: ({ focused }) => (
              <Text className={`${focused ? 'font-psemibold' : 'font-pregular'} text-xs text-white mt-2`}>
                Bookmark
              </Text>
            ),
            tabBarIcon: ({ color }) => (
              <Image 
                source={icons.bookmark}
                style={{ width: 24, height: 24, tintColor: color }}
                resizeMode="contain"
              />
            ),
          }}
        />

        <Tabs.Screen 
          name="profile"
          options={{
            tabBarLabel: ({ focused }) => (
              <Text className={`${focused ? 'font-psemibold' : 'font-pregular'} text-xs text-white mt-2`}>
                Profile
              </Text>
            ),
            tabBarIcon: ({ color }) => (
              <Image 
                source={icons.profile}
                style={{ width: 24, height: 24, tintColor: color }}
                resizeMode="contain"
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
};

export default TabsLayout;