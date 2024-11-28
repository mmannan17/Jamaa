import { useState, useEffect, useContext } from "react";
import { FlatList, View } from "react-native";
import * as Animatable from "react-native-animatable";
import TimeTable from "./TimeTable";
import { Context } from "./globalContext";

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

const PinnedMosquesCarousel = () => {
  const { followedMosques, mosques, fetchPrayerTimes } = useContext(Context);
  const [activeItem, setActiveItem] = useState(null);
  const [pinnedMosques, setPinnedMosques] = useState([]);

  useEffect(() => {
    const loadPrayerTimes = async () => {
      try {
        // Return early if no followed mosques
        if (!followedMosques?.length) {
          setPinnedMosques([]);
          return;
        }

        // Get full mosque details for followed mosques
        const followedMosqueDetails = followedMosques
          .map(mosqueId => mosques.find(m => m.mosque?.mosque_id === mosqueId))
          .filter(mosque => mosque !== undefined);

        // Return if no valid mosque details found
        if (!followedMosqueDetails.length) {
          setPinnedMosques([]);
          return;
        }

        // Fetch prayer times for each mosque
        const mosquesWithPrayerTimes = await Promise.all(
          followedMosqueDetails.map(async (mosque) => {
            try {
              const prayerTimes = await fetchPrayerTimes(mosque.mosque.mosque_id);
              return {
                id: mosque.mosque.mosque_id.toString(),
                name: mosque.mosque.mosquename,
                // Use prayer times if available, otherwise empty strings
                fajr: prayerTimes?.Fajr || '',
                dhuhr: prayerTimes?.Zuhr || '',
                asr: prayerTimes?.Asr || '',
                maghrib: prayerTimes?.Maghrib || '',
                isha: prayerTimes?.Isha || '',
              };
            } catch (error) {
              console.error(`Error fetching prayer times for mosque ${mosque.mosque.mosque_id}:`, error);
              // Return mosque with empty prayer times
              return {
                id: mosque.mosque.mosque_id.toString(),
                name: mosque.mosque.mosquename,
                fajr: '',
                dhuhr: '',
                asr: '',
                maghrib: '',
                isha: '',
              };
            }
          })
        );
        
        setPinnedMosques(mosquesWithPrayerTimes);
        if (mosquesWithPrayerTimes.length > 0) {
          setActiveItem(mosquesWithPrayerTimes[0].id);
        }
      } catch (error) {
        console.error('Error loading prayer times:', error);
        setPinnedMosques([]);
      }
    };

    loadPrayerTimes();
  }, [followedMosques, mosques]);

  if (!pinnedMosques.length) return null;

  return (
    <FlatList
      data={pinnedMosques}
      horizontal
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PinnedMosqueItem 
          activeItem={activeItem} 
          item={item} 
          isSingleItem={pinnedMosques.length === 1}
        />
      )}
      onViewableItemsChanged={({ viewableItems }) => {
        if (viewableItems.length > 0) {
          setActiveItem(viewableItems[0].item.id);
        }
      }}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 70,
      }}
      contentContainerStyle={{ paddingHorizontal: 5 }}
      showsHorizontalScrollIndicator={false}
    />
  );
};

export default PinnedMosquesCarousel;
