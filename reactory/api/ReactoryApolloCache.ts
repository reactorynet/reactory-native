import {InMemoryCache, InMemoryCacheConfig} from '@apollo/client';
import {CachePersistor, AsyncStorageWrapper} from 'apollo3-cache-persist';
import LocalStorage from '@react-native-community/async-storage';

const config: InMemoryCacheConfig = {};

export const cache: InMemoryCache = new InMemoryCache(config);

export const getCache = async (debug: boolean = true) => {
  let reactory_persistor = new CachePersistor({
    cache,
    storage: new AsyncStorageWrapper(LocalStorage),
    debug,
    trigger: 'write',
    key: 'reactory_apollo_cache',
    maxSize: false,
  });

  await reactory_persistor.restore().then();

  return {
    cache,
    persistor: reactory_persistor,
  };
};
