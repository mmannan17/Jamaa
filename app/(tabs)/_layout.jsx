import { View, Text, Image } from 'react-native';
import {Tabs, Redirect} from 'expo-router';
import {icons} from '../../constants'



const TabIcon = ({icon, color, name, focused}) => {
  return (
    <View className = 'items-center justify-center gap-2'>
      <Image
        source = {icons['home']}
        resizeMode = "contain"
        tintColor = {color}
        className="w-5 h-5"
      />
      <Text className={`${focused ? 'font-psemibold': 'font-pregular'} test-xs`}>
        {name}
      </Text>
    </View>
  )
}
const TabsLayout = () => {
  return (
    <>
      <Tabs screenOptions = {{
        tabBarShowLabel: false
      }}>
        <Tabs.Screen name ="home"
      options = {{
        title: 'Home',
        headerShown: false,
        tabBarIcon: ({color, focused}) => (
          <TabIcon
            icon = {icons.home}
            color = {color}
            name = "Home"
            focused = {focused}
            />
        )
      }} />

      <Tabs.Screen name ="search"
      options = {{
        title: 'Search',
        headerShown: false,
        tabBarIcon: ({color, focused}) => (
          <TabIcon
            icon = {icons.home}
            color = {color}
            name = "Search"
            focused = {focused}
            />
        )
      }} />

      <Tabs.Screen name ="bookmark"
      options = {{
        title: 'Bookmark',
        headerShown: false,
        tabBarIcon: ({color, focused}) => (
          <TabIcon
            icon = {icons.home}
            color = {color}
            name = "Bookmark"
            focused = {focused}
            />
        )
      }} />

<Tabs.Screen name ="create"
      options = {{
        title: 'create',
        headerShown: false,
        tabBarIcon: ({color, focused}) => (
          <TabIcon
            icon = {icons.profile}
            color = {color}
            name = "Create"
            focused = {focused}
            />
        )
      }} />
      </Tabs>
    </>
  )
}

export default TabsLayout