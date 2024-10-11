import React, {useState, useEffect, useRef, createContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

const Context = createContext()

const Provider = ( { children } ) => {

    const [ domain ] = useState("http://masjidapp-dev.us-east-1.elasticbeanstalk.com/")
    const [ isLoggedIn, setIsLoggedIn ] = useState(false)
    const [authToken, setAuthToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [user, setUser] = useState(null);
    const [allPosts, setAllPosts] = useState([]);
    const [mosques, setMosques] = useState([])
    const [mosquePosts, setMosquePosts] = useState([])
    const [location, setLocation] = useState({ latitude: null, longitude: null });
    const [isLocationShared, setIsLocationShared] = useState(false);
    const [nearbyMosques, setNearbyMosques] = useState([]);



    useEffect(() => {
      if (user && user.username) {
        getUserLocation(user.username);
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
          await AsyncStorage.setItem('refreshToken', data.refresh);
          await AsyncStorage.setItem('userData', JSON.stringify(data.user));
          setAuthToken(data.access);
          setRefreshToken(data.refresh);
          setUser(data.user); 
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
        await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userData']);
        setAuthToken(null);
        setRefreshToken(null);
        setIsLoggedIn(false);
        setUser(null);
        router.replace("/sign-in")
    };

    const refreshAccessToken = async () => {
      try {
        const currentRefreshToken = await AsyncStorage.getItem('refreshToken');
        if (!currentRefreshToken) throw new Error('No refresh token found');
    
        const response = await fetch(`${domain}/api/token/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: currentRefreshToken }),
        });
    
        const data = await response.json();
        if (response.ok) {
          await AsyncStorage.setItem('authToken', data.access);
          setAuthToken(data.access);
          return data.access;
        } else {
          throw new Error(data.detail || 'Token refresh failed');
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
        logout(); // Force logout if refresh fails
        throw error;
      }
    };

    const authenticatedFetch = async (url, options = {}) => {
      let token = await AsyncStorage.getItem('authToken');
    
      if (!token) {
        throw new Error('No token found');
      }
    
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
          },
        });
    
        if (response.status === 401) {
          // Token might be expired, try to refresh
          token = await refreshAccessToken();
          // Retry the request with the new token
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${token}`,
            },
          });
        }
    
        return response;
      } catch (error) {
        console.error('Error in authenticatedFetch:', error);
        throw error;
      }
    };

    const checkExistingToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const userData = await AsyncStorage.getItem('userData');
        
        if (token && refreshToken && userData) {
          setAuthToken(token);
          setRefreshToken(refreshToken);
          setUser(JSON.parse(userData));
          setIsLoggedIn(true);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error checking existing token:', error);
        return false;
      }
    };

  const getPosts = async () => {
    try {
      const response = await authenticatedFetch(`${domain}/MosqueApp/posts/`, {
        method: 'GET',
      });
      const data = await response.json();
      if (response.ok) {
        // Sort the posts by creation date in descending order
        const sortedPosts = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setAllPosts(sortedPosts);
      } else {
        throw new Error(data.detail || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const getUserLocation = async (username) => {
    try {
      const locationSharedKey = `${username}_locationShared`;
      const locationShared = await AsyncStorage.getItem(locationSharedKey);
  
      // If no prior location sharing history, always request permissions
      if (locationShared === null || locationShared === 'false') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log(status)
  
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          await AsyncStorage.setItem(locationSharedKey, 'true'); // Store permission
          setLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          setIsLocationShared(true);
  
          return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
        } else {
          // Permission denied, store false and don't set location
          await AsyncStorage.setItem(locationSharedKey, 'false');
          setIsLocationShared(false);
          console.log('Location permission denied.');
          return null;
        }
      }
  
      // If the user has already shared their location before
      if (locationShared === 'true') {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          });
          setLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          setIsLocationShared(true);
  
          return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
        } else {
          console.log('Location permission was not granted.');
          return null;
        }
      }
  
      return null; // Default return if none of the conditions are met
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const getNearbyMosques = async () => {
    try {
      const location = await getUserLocation();
      if (!location || !location.latitude || !location.longitude) {
        throw new Error('Unable to get user location');
      }

      const response = await authenticatedFetch(`${domain}/MosqueApp/nearby_mosques/?lon=${location.longitude}&lat=${location.latitude}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch nearby mosques');
      }

      const data = await response.json();
      setNearbyMosques(data);
      return data;
    } catch (error) {
      console.error('Error fetching nearby mosques:', error);
      // Alert.alert('Error', 'Failed to fetch nearby mosques. Please try again.');
      return [];
    }
  };

  const getMosques = async () => {
    try {
      const response = await authenticatedFetch(`${domain}/MosqueApp/mosques/`, {
        method: 'GET',
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

  const getMosquePosts = async (mosquename) => {
    try {
      const response = await authenticatedFetch(`${domain}/MosqueApp/posts/?mosquename=${mosquename}`, {
        method: 'GET',
      });
      const data = await response.json();
      if (response.ok) {
        setMosquePosts(data);
      } else {
        throw new Error(data.detail || 'Failed to fetch mosque posts');
      }
    } catch (error) {
      console.error('Error fetching mosque posts:', error);
    }
  };



  const createPost = async (data) => {
    try {
      // Step 1: Initial POST request to get the upload URL
      const initialResponse = await authenticatedFetch(`${domain}/MosqueApp/post/media/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_name: data.media_file.file_name || 'image.jpg',
          file_type: data.media_file.file_type || 'image/jpeg',
        }),
      });

      if (!initialResponse.ok) {
        throw new Error(`HTTP error, status: ${initialResponse.status}`);
      }

      const initialResult = await initialResponse.json();
      if (!initialResult.url) {
        throw new Error('Upload URL not found in the response');
      }
      const uploadUrl = initialResult.url.split('?')[0];

      // Step 2: PUT request to upload the binary image
      const blob = data.media_file.media;

      const putResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': data.media_file.file_type,
        },
      });

      if (!putResponse.ok) {
        throw new Error(`Failed to upload image: ${putResponse.statusText}`);
      } else {
        console.log('binary uploaded successfully');
      }

      // Step 3: Create the post with the uploaded image URL
      const postResponse = await authenticatedFetch(`${domain}/MosqueApp/post/save/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          posttype: "media",
          media_type: data.media_file.file_type.startsWith('image') ? "image" : "video",
          media_url: uploadUrl,
          mosque_id: user.mosque.mosque_id,
          mosque_name: user.username,
          content: data.content
        }),
      });

      if (!postResponse.ok) {
        throw new Error(`Failed to create post: ${postResponse.statusText}`);
      }

      const postResult = await postResponse.json();
      
      // Update the posts state
      setAllPosts(prevPosts => [postResult, ...prevPosts]);

    } catch (error) {
      console.error('Error in createPost:', error);
      throw error;
    }
  };
  
  const deletePost = async (postId) => {
    try {
      const response = await authenticatedFetch(`${domain}/MosqueApp/posts/${postId}/delete/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete post');
      }

      // Remove the deleted post from allPosts and mosquePosts
      setAllPosts(prevPosts => prevPosts.filter(post => post.post_id !== postId));
      setMosquePosts(prevPosts => prevPosts.filter(post => post.post_id !== postId));

      // Optionally, you can show a success message here
      Alert.alert('Success', 'Post deleted successfully');

      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post. Please try again.');
      return false;
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
        checkExistingToken,
        deletePost,
        location,
        getUserLocation, 
        getNearbyMosques,
        nearbyMosques,
    };

    return (
        <Context.Provider value={globalContext}>
          {children}
        </Context.Provider>
      );
};

export { Context, Provider };