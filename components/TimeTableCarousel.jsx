import { useState } from "react";
import { FlatList, View } from "react-native";
import * as Animatable from "react-native-animatable";
import TimeTable from "./TimeTable";

const samplePinnedMosques = [
  {
    id: '1',
    name: 'Masjid Al-Noor',
    fajr: '05:30',
    sunrise: '06:00',
    dhuhr: '13:15',
    asr: '16:45',
    maghrib: '19:30',
    isha: '21:00',
  },
  {
    id: '2',
    name: 'Islamic Center',
    fajr: '05:15',
    sunrise: '05:45',
    dhuhr: '13:00',
    asr: '16:30',
    maghrib: '19:25',
    isha: '20:45',
  },
  {
    id: '3',
    name: 'Masjid As-Salam',
    fajr: '05:45',
    sunrise: '06:15',
    dhuhr: '13:30',
    asr: '17:00',
    maghrib: '19:35',
    isha: '21:15',
  },
  {
    id: '4',
    name: 'Downtown Mosque',
    fajr: '05:20',
    sunrise: '05:50',
    dhuhr: '13:10',
    asr: '16:40',
    maghrib: '19:28',
    isha: '20:55',
  },
];

const zoomIn = {
  0: {
    scale: 0.9,
  },
  1: {
    scale: 1,
  },
};

const zoomOut = {
  0: {
    scale: 1,
  },
  1: {
    scale: 0.9,
  },
};

const PinnedMosqueItem = ({ activeItem, item, isSingleItem }) => {
  return (
    <Animatable.View
      className={`mr-2 ${isSingleItem ? 'w-[350px]' : 'w-72'}`}
      animation={activeItem === item.id ? zoomIn : zoomOut}
      duration={500}
    >
      <View className="rounded-[33px] my-5 overflow-hidden shadow-lg shadow-black/40">
        <TimeTable mosque={item} />
      </View>
    </Animatable.View>
  );
};

const PinnedMosquesCarousel = ({ pinnedMosques = samplePinnedMosques }) => {
  const [activeItem, setActiveItem] = useState(pinnedMosques[0]?.id || null);
  const isSingleItem = pinnedMosques.length === 1;

  const viewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveItem(viewableItems[0].item.id);
    }
  };

  return pinnedMosques.length > 0 ? (
    <FlatList
      data={pinnedMosques}
      horizontal
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PinnedMosqueItem 
          activeItem={activeItem} 
          item={item} 
          isSingleItem={isSingleItem}
        />
      )}
      onViewableItemsChanged={viewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 70,
      }}
      contentContainerStyle={{ paddingHorizontal: 5 }}
      showsHorizontalScrollIndicator={false}
    />
  ) : null;
};

export default PinnedMosquesCarousel;
