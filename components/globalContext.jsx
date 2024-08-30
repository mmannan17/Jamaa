import React, {useState, useEffect, useRef, createContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router } from 'expo-router';

const Context = createContext()

const Provider = ( { children } ) => {

    const [ domain ] = useState("http://masjidapp-dev.us-east-1.elasticbeanstalk.com/")
    const [ isLoggedIn, setIsLoggedIn ] = useState(false)
    const [authToken, setAuthToken] = useState(null);
    const [user, setUser] = useState(null);
    const [allPosts, setAllPosts] = useState([]);
    const [mosques, setMosques] = useState([])
    const [mosquePosts, setMosquePosts] = useState([])
    const [location, setLocation] = useState({ latitude: null, longitude: null });
    const [isLocationShared, setIsLocationShared] = useState(false);



    useEffect(() => {
      if (user && user.username) {
        getLocationForUser(user.username);
      }
    }, [user]);

    const login = async (username, password) => {
      try {
        const response = await fetch(`${domain}/MosqueApp/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
  
        const data = await response.json();
        if (response.ok) {
          await AsyncStorage.setItem('authToken', data.access);
          setAuthToken(data.access);
          setUser(data.user); // Set user info
          setIsLoggedIn(true);
        } else {
          throw new Error(data.detail || 'Login failed');
        }
      } catch (error) {
        console.error('Error logging in:', error);
        throw error;
      }
    };
  

    const logout = async () => {
        await AsyncStorage.removeItem('authToken');
        setAuthToken(null);
        setIsLoggedIn(false);
        setUser(null)
        router.replace("/sign-in")
    };

  const getPosts = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${domain}/MosqueApp/posts/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAllPosts(data);
      } else {
        throw new Error(data.detail || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const getLocationForUser = async (username) => {
    try {
      const locationSharedKey = `${username}_locationShared`;
      const locationShared = await AsyncStorage.getItem(locationSharedKey);
      
      if (locationShared === 'true') {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          setIsLocationShared(true);
        }
      } else if (locationShared === null) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          await AsyncStorage.setItem(locationSharedKey, 'true');
          setIsLocationShared(true);
        } else {
          await AsyncStorage.setItem(locationSharedKey, 'false');
          setIsLocationShared(false);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };


  const getMosques = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${domain}/MosqueApp/mosques/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        const mosques = data.filter(account => account.role === 'mosque');
        setMosques(mosques);
      } else {
        throw new Error(data.detail || 'Failed to fetch mosques');
      }
    } catch (error) {
      console.error('Error fetching Mosques:', error);
    }
  };

  const getMosquePosts = async (mosqueId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('No token found');

      const response = await fetch(`${domain}/MosqueApp/posts/?mosque=${mosqueId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setMosquePosts(data);
      } else {
        throw new Error(data.detail || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };


  const createPost = async (postData) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('No token found');
      const response = await fetch(`${domain}/MosqueApp/posts/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      const data = await response.json();
      if (response.ok) {
        setAllPosts((prevPosts) => [...prevPosts, data]);
      } else {
        throw new Error(data.detail || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };


    const globalContext = {
        isLoggedIn,
        setIsLoggedIn,
        login,
        logout,
        getPosts,
        user,
        allPosts,
        mosques,
        getMosques,
        getMosquePosts,
        mosquePosts,
        createPost,
        location, // Provide the location data
        getLocationForUser, // Provide the location fetch function
    };

    return (
        <Context.Provider value={globalContext}>
          {children}
        </Context.Provider>
      );
};

export { Context, Provider };