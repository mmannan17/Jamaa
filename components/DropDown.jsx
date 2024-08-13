import { Image, View, Text, TextInput, TouchableOpacity } from 'react-native'
import React, {useState} from 'react'
import {icons} from '../constants'
import RNPickerSelect from 'react-native-picker-select';

const Dropdown = ({title, value, placeholder,
handleChangeText, otherStyles, ...props}) => {
    const [selectedValue, setSelectedValue] = useState(null);

    const placeholderConfig = {
        label: 'Select Type',
        value: null,
        color: '#7b7b8b',
    };

    const options = [
        { label: 'Video', value: 'option1' },
        { label: 'Image', value: 'option2' },
        { label: 'Text', value: 'option3' },
    ];
  return (
    <View className={`space-y-2 ${otherStyles}`}>
      <Text className ="test-base text-gray-100 font-pmedium text-lg ">{title}</Text>

      <View className=" border-2 border-black-200 rounded-2xl focus:border-secondary items-center w-full h-16 px-4 bg-black-100 flex-row">
        <RNPickerSelect className="flex-1 text-white font-psemibold text-base"
        placeholder={placeholder}
        items={options}
        onValueChange={(value) => {
          setSelectedValue(value);
          handleChangeText(value);
        }}
        value={selectedValue}
        style={{
          inputIOS: {
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
            flex: 1,
            height: '100%',
            paddingHorizontal: 0,
            paddingVertical: 10
          },
          inputAndroid: {
            color: 'white',
            fontSize: 16,
            height: '100%',
            fontWeight: '600',
            flex: 1,
            paddingHorizontal: 0,
            paddingVertical: 10 
          },
          placeholder: {
            color: '#7b7b8b',
            fontSize: 'xl',
            fontWeight: '600',
          },
          iconContainer: {
            top: 10,
            right: 12,
          },
        }}
        useNativeAndroidPickerStyle={false}
      />
      {/* {<Text className="flex-1 text-white font-psemibold text-base">Selected: {selectedValue}</Text>} */}

      </View>
    </View>
  )
}

export default Dropdown
