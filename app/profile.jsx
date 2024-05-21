import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const Profile = () => {
  return (
    <View className="flex-1 items-start justify-start bg-white">
      <Text className ="text-3xl text-center pt-4 pl-4">The Profile page</Text>
      <Text className ="text-xl text-center justify-start text-left pt-20">The Profile page is {"\n"}
      a page to show the accounts settings so they can modify shi yk</Text>
    </View>
  )
}

export default Profile

const styles = StyleSheet.create({})