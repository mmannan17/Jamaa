import { Image, View, Text, TextInput, TouchableOpacity } from 'react-native'
import React, {useState} from 'react'
import {icons} from '../constants'

const SearchInput = ({title, value, placeholder,
handleChangeText, otherStyles, ...props}) => {
    const [showPassword, setshowPassword] = useState(false)
  return (
      <View className="border-2 border-black-200 rounded-2xl focus:border-secondary items-center w-full h-16 px-4 bg-black-100 flex-row space-x-4 my-2">
        <TextInput className="text-base text-white flex-1 font-pregular"
        value={value}
        placeholder="Search for a Masjid Nearby"
        placeholderTextColor="#7b7b8b"
        onChangeText={handleChangeText}
        secureTextEntry={title === 'Password' && !showPassword}
        />

        <TouchableOpacity>
            <Image
                source={icons.search}
                className="w-5 h-5"
                resizeMode='contain'
            />
        </TouchableOpacity>

      </View>

  )
}

export default SearchInput
