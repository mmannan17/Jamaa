// import React from 'react';
// import { Provider, Context } from '../components/globalContext';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import SignIn from './(auth)/sign-in';
// import Home from './(tabs)/home';
// import LandingPage from '.';

// const Stack = createStackNavigator();

// const App = () => {
//     const { isLoggedIn } = useContext(Context);
//     return (
//         <Provider>
//             <NavigationContainer>
//                 <Stack.Navigator initialRouteName={isLoggedIn ? "Home" : "LandingPage"} screenOptions={{gestureEnabled: false}}>
//                     <Stack.Screen name="LandingPage" component={LandingPage} options={{ headerShown: false }} />
//                     <Stack.Screen name="SignIn" component={SignIn} />
//                     <Stack.Screen name="Home" component={Home} />
//                 </Stack.Navigator>
//             </NavigationContainer>
//         </Provider>
//     );
// };

// export default App;
