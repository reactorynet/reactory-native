import {
  ApolloClient,
  Resolvers,
  split,
  NormalizedCacheObject,
} from '@apollo/client';

import {WebSocketLink} from '@apollo/link-ws';
import {setContext} from '@apollo/link-context';
import {getMainDefinition} from '@apollo/client/utilities';
import {SubscriptionClient} from 'subscriptions-transport-ws';
import {createUploadLink} from 'apollo-upload-client';
import {getCache} from './ReactoryApolloCache';
import LocalStorage from '@react-native-community/async-storage';

const packageInfo: any = require('../../package.json');
const anonToken: string =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJpZC5yZWFjdG9yeS5uZXQiLCJpYXQiOjE1MTY1OTM3MjAsImV4cCI6MTU3MTcxODYxMCwiYXVkIjoiYXBwLnJlYWN0b3J5Lm5ldCIsInN1YiI6InJlYWN0b3J5LWF1dGgiLCJuYW1lIjoiR3Vlc3QiLCJsYXN0bmFtZSI6IlVzZXIiLCJ1c2VySWQiOiItMSJ9.aFYx4p09_KWtKLlOl05YbNiEBzcX3kFD9mvykmA7oGL92mTKdt-VVUFrIaEXfYcszBIaIjHWN_sC66mq7kggVw';

const {
  REACT_APP_CLIENT_KEY = 'reactory',
  REACT_APP_CLIENT_PASSWORD = '',
  REACT_APP_API_ENDPOINT = 'https://api.reactory.net/api',
  REACT_APP_APP_TITLE = 'Reactory',
} = process.env;

if (LocalStorage) {
  LocalStorage.setItem('REACT_APP_CLIENT_KEY', REACT_APP_CLIENT_KEY);
  LocalStorage.setItem('REACT_APP_CLIENT_PASSWORD', REACT_APP_CLIENT_PASSWORD);
  LocalStorage.setItem('REACT_APP_API_ENDPOINT', REACT_APP_API_ENDPOINT);
}

export default async () => {
  // get the authentication token from local storage if it exists
  const token = (await LocalStorage.getItem('auth_token').then()) || anonToken;

  let persistedCache: any = null;
  let cache: any = null;
  let persistor: any = null;
  try {
    persistedCache = await getCache(true);
    cache = persistedCache.cache ? persistedCache.cache : null;
    persistor = persistedCache.persistor ? persistedCache.persistor : null;
  } catch (cacheGetError: any) {
    console.error(`${cacheGetError.message}`);
  }

  const clearCache = () => {
    if (!persistor) {
      return;
    }
    persistor.purge();
  };

  const authLink = setContext((_, {headers}) => {
    let deviceId = 'default';
    let deviceOS = 'android';
    let os_version = '21';

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
        'x-client-key': `${process.env.REACT_APP_CLIENT_KEY}`,
        'x-client-pwd': `${process.env.REACT_APP_CLIENT_PASSWORD}`,
        'x-client-version': `${packageInfo.version}`,
        'x-client-name': REACT_APP_APP_TITLE,
        userAgent: `ReactoryNative ${deviceId} ${deviceOS} ${os_version}`,
      },
    };
  });

  const uploadLink = createUploadLink({
    uri: REACT_APP_API_ENDPOINT,
    fetch: fetch,
  });

  let clientTypeDefs: string[] = [];
  let resolvers: Resolvers[] = [];

  const ws_client = new SubscriptionClient(
    REACT_APP_API_ENDPOINT.replace('http', 'ws'),
    {
      reconnect: true,
      reconnectionAttempts: 5,
      timeout: 1000,
      connectionParams: {
        Authorization: `Bearer ${token}`,
        authToken: token,
      },
    },
  );

  const ws_link = new WebSocketLink(ws_client);

  const splitLink = split(
    ({query}) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    ws_link,
    authLink.concat(uploadLink),
  );

  const client = new ApolloClient<NormalizedCacheObject>({
    link: splitLink, //authLink.concat(uploadLink),
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'network-only',
        errorPolicy: 'ignore',
      },

      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },

      mutate: {
        errorPolicy: 'all',
      },
    },
    typeDefs: clientTypeDefs,
    resolvers: resolvers,
    assumeImmutableResults: false,
  });

  return {
    client,
    ws_link,
    clearCache,
  };
};
