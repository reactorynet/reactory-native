/* eslint-disable prettier/prettier */
/**
 * @format
 */
import React from 'react';
import { REACT_APP_API_ENDPOINT } from 'react-native-dotenv';
import {Navigation} from 'react-native-navigation';
import {DefaultTheme, Provider as MaterialProvider, Text} from 'react-native-paper';
import {ApolloClient, InMemoryCache, ApolloProvider} from '@apollo/client';
import {ReactoryProvider} from './reactory/api/ReactoryProvider';
import Root from './App';
import ReactoryApi from './reactory/api';


const App = () => {
    
  //const [v, setV] = React.useState(0);  

  const client = new ApolloClient({
    uri: `${REACT_APP_API_ENDPOINT || 'https://60e7-160-19-235-94.ngrok.io'}`,
    cache: new InMemoryCache(),
  });

  const reactory = new ReactoryApi({
    client,
  });

  React.useEffect(() => {

    reactory.init();

    return () => {
      //shutdown
    };
  });

  if (reactory.client === null) {
    return (<Text>LOADING</Text>);
  }

  return (
    <ApolloProvider client={client}>
      <MaterialProvider theme={DefaultTheme}>
        <ReactoryProvider reactory={reactory}>
          <Root />
        </ReactoryProvider>
      </MaterialProvider>
    </ApolloProvider>);
};

Navigation.registerComponent('core.Application@1.0.0', () => App);

Navigation.events().registerAppLaunchedListener(() => {
  Navigation.setRoot({
    root: {
      stack: {
        children: [
          {
            component: {
              name: 'core.Application@1.0.0',
            },
          },
        ],
      },
    },
  });
});
