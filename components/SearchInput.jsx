import { Image, View, TextInput, TouchableOpacity, Alert } from 'react-native'
import React, { useState } from 'react'
import { icons } from '../constants'
import { router, usePathname } from 'expo-router'

const SearchInput = () => {
    const pathname = usePathname()
    const [query, setQuery] = useState('')

    const handleSearch = () => {
        if (!query.trim()) {
            return Alert.alert("Missing Query", "Please input something to search")
        }
        router.push(`/search/${encodeURIComponent(query.trim())}`)
    }

    return (
        <View className="border-2 border-black-200 rounded-2xl focus:border-secondary items-center w-full h-16 px-4 bg-black-100 flex-row space-x-4 my-2">
            <TextInput
                className="text-base text-white flex-1 font-pregular"
                value={query}
                placeholder="Search for a Masjid Nearby"
                placeholderTextColor="#CDCDE0"
                onChangeText={(e) => setQuery(e)}
                onSubmitEditing={handleSearch}
            />
            <TouchableOpacity onPress={handleSearch}>
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
