import React, { forwardRef } from 'react';
import { View, TextInput, TouchableOpacity, Image } from 'react-native';
import { icons } from '../constants';

// Wrap in forwardRef to allow ref to be passed
const NewSearchInput = forwardRef(({ query, setQuery, onFocus, onBlur }, ref) => {
    return (
        <View className="border-2 border-black-200 rounded-2xl focus:border-secondary items-center w-full h-16 px-4 bg-black-100 flex-row space-x-4 my-2">
            <TextInput
                ref={ref} // Attach the ref here
                className="text-base text-white flex-1 font-pregular"
                value={query}
                placeholder="Search for a Masjid Nearby"
                placeholderTextColor="#CDCDE0"
                onChangeText={(e) => setQuery(e)}
                onFocus={onFocus}  // Use onFocus
                onBlur={onBlur}    // Use onBlur
            />
            <TouchableOpacity>
                <Image
                    source={icons.search}
                    className="w-5 h-5"
                    resizeMode='contain'
                />
            </TouchableOpacity>
        </View>
    );
});

export default NewSearchInput;
