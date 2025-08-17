/**
 * Reactory Native App
 * Modern React Native application with TypeScript, Redux Toolkit, React Navigation, and Apollo GraphQL
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client';
import { PaperProvider } from 'react-native-paper';
import { AppNavigator } from './src/navigation/AppNavigator';
import { store } from './src/store';
import { apolloClient } from './src/services/apolloClient';
import { lightTheme, darkTheme } from './src/themes';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ApolloProvider client={apolloClient}>
      <Provider store={store}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <StatusBar 
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
              backgroundColor={theme.colors.surface}
            />
            <AppNavigator />
          </SafeAreaProvider>
        </PaperProvider>
      </Provider>
    </ApolloProvider>
  );
}

export default App;
