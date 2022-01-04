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

  const [reactory, setReactory] = React.useState<ReactoryApi>();

  const reactoryInit = async () => {
    let $reactory = new ReactoryApi({});
    $reactory = await $reactory.init();
    return $reactory;
  }

  React.useEffect(() => {
    reactoryInit().then(($reactory) => {
      $reactory.log(`Reactory Native Initializaed`, { REACT_APP_API_ENDPOINT })
      setReactory($reactory);
    })
    return () => {
      //shutdown
    };
  }, []);

  if (reactory === null || reactory === undefined) {
    return (<Text>Waiting for client</Text>);
  }

  return (
    <ApolloProvider client={reactory.client}>
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
