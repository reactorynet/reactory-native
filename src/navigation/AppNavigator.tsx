import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import HomeScreen from '../screens/HomeScreen';
import DetailsScreen from '../screens/DetailsScreen';
import GraphQLDemoScreen from '../screens/GraphQLDemoScreen';

export type RootStackParamList = {
  Home: undefined;
  Details: { title?: string };
  GraphQLDemo: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6200ee',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Reactory Native' }}
        />
        <Stack.Screen 
          name="Details" 
          component={DetailsScreen}
        />
        <Stack.Screen 
          name="GraphQLDemo" 
          component={GraphQLDemoScreen}
          options={{ title: 'GraphQL Demo' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
