import React, {useState, useEffect, useRef, createContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert } from 'react-native';

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
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
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

  const getMosquePosts = async (mosqueId) => {
    try {
      const response = await authenticatedFetch(`${domain}/MosqueApp/posts/?mosque=${mosqueId}`, {
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
      const formData = new FormData();
      formData.append('mosque', data.mosque);
      formData.append('content', data.content);
      formData.append('posttype', data.posttype);

      if (data.media_file) {
        const fileUri = data.media_file.uri;
        const fileType = data.media_file.mimeType || 'image/jpeg';
        const fileName = data.media_file.fileName || fileUri.split('/').pop() || 'image.jpg';

        formData.append('media_file', {
          uri: fileUri,
          type: fileType,
          name: fileName,
        });
      }

      console.log('Sending formData:', formData);

      const response = await authenticatedFetch(`${domain}/MosqueApp/post/media/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error, status: ${response.status}`);
      }

      const result = JSON.parse(responseText);
      setAllPosts((prevPosts) => [result, ...prevPosts]);
      return result;
    } catch (error) {
      console.error('Post creation failed:', error.message || error);
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
    };

    return (
        <Context.Provider value={globalContext}>
          {children}
        </Context.Provider>
      );
};

export { Context, Provider };