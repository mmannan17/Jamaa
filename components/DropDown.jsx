import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

const Dropdown = ({title, value, placeholder, options, handleChangeText}) => {
  const [selectedValue, setSelectedValue] = useState('');

  return (
    <View className="space-y-2 mt-5">
      <Text className="text-lg text-gray-100 font-pmedium">{title}</Text>
      <View style={styles.dropdownContainer}>
        <RNPickerSelect
          placeholder={{
            label: placeholder,
            value: null,
            color: '#7b7b8b',
          }}
          items={options}
          onValueChange={(value) => {
            setSelectedValue(value);
            handleChangeText(value);
          }}
          value={selectedValue}
          style={{
            inputIOS: styles.pickerText,
            inputAndroid: styles.pickerText,
            placeholder: styles.placeholderText,
          }}
          useNativeAndroidPickerStyle={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    borderWidth: 2,
    borderColor: '#232533',
    borderRadius: 12,
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: '#1E1E2D',
    justifyContent: 'center',
  },
  pickerText: {
    color: '#CDCDE0',
    fontFamily: 'psemibold',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 0,
  },
  placeholderText: {
    color: '#7b7b8b',
  },
});

export default Dropdown;
