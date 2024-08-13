import { Image, View, Text, TextInput, TouchableOpacity } from 'react-native'
import React, {useState} from 'react'
import {icons} from '../constants'
import RNPickerSelect from 'react-native-picker-select';

const TestDropDown = () => {
    const [selectedValue, setSelectedValue] = useState(null);

    const placeholder = {
      label: 'Select an option...',
      value: null,
    };
  
    const options = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ];
  
    return (
      <View className="">
        <Text className="test-base text-gray-100 font-pmedium text-lg">Select an option:</Text>
        <RNPickerSelect
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
              paddingHorizontal: 0,
              paddingVertical: 20 // Remove default padding
            },
            inputAndroid: {
              color: 'white',
              fontSize: 16,
              fontWeight: '600',
              flex: 1,
              paddingHorizontal: 0, // Remove default padding
            },
            placeholder: {
              color: '#7b7b8b',
            },
            iconContainer: {
              top: 10,
              right: 12,
            },
          }}
          useNativeAndroidPickerStyle={false}
        />
        {selectedValue && <Text>Selected: {selectedValue}</Text>}
      </View>
    );
}

export default TestDropDown
