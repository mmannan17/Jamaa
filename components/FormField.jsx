import { Image, View, Text, TextInput } from 'react-native'
import React, {useState} from 'react'
import { TouchableOpacity } from 'react-native-gesture-handler'
import {icons} from '../constants'

const FormField = ({title, value, placeholder,
handleChangeText, otherStyles, ...props}) => {
    const [showPassword, setshowPassword] = useState(false)
  return (
    <View className={`space-y-2 ${otherStyles}`}>
      <Text className ="test-base text-gray-100 font-pmedium text-xl ">{title}</Text>

      <View className=" border-2 border-black-200 rounded-2xl focus:border-secondary items-center w-full h-16 px-4 bg-black-100">
        <TextInput className="flex-1 text-white font-psemibold text-base"
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#7b7b8b"
        onChangeText={handleChangeText}
        secureTextEntry={title === 'Password' && !showPassword}
        />

        {title === 'Password' && (
            <TouchableOpacity onPress={() => setshowPassword(!showPassword)}>
                <Image source = {!showPassword ? icons.eye : icons.eyehide} />
            </TouchableOpacity>
        )}

      </View>
    </View>
  )
}

export default FormField
