import React from 'react';
import { View, Text } from 'react-native';

const TimeTable = ({ mosque }) => {
  const prayerTimes = mosque?.prayerTimes || {};

  return (
    <View className="bg-primary p-4 rounded-[33px] border-2 border-secondary">
      <Text className="text-white text-lg font-pbold mb-2">{mosque?.name || 'Mosque Name'}</Text>
      <View className="flex-row justify-between">
        <View className="flex-1 mr-2">
          <TimeRow label="Fajr" time={mosque.fajr} />
          <TimeRow label="Dhuhr" time={mosque.dhuhr} />
          <TimeRow label="Asr" time={mosque.asr} />
        </View>
        <View className="flex-1 ml-2">
          <TimeRow label="Maghrib" time={mosque.maghrib} />
          <TimeRow label="Isha" time={mosque.isha} />
        </View>
      </View>
    </View>
  );
};

const TimeRow = ({ label, time }) => (
  <View className="flex-row justify-between mb-1">
    <Text className="text-gray-300">{label}</Text>
    <Text className="text-white font-pmedium">{time}</Text>
  </View>
);

export default TimeTable;
