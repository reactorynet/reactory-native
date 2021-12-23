import React, {Component, Children, createContext, useContext} from 'react';
import {View} from 'react-native';
import ReactoryApi from './ReactoryApi';

export interface ReactoryProviderProps {
  reactory: ReactoryApi;
}

export const ReactoryContext = createContext<ReactoryApi | null>(null);

export const ReactoryProvider = ({children, reactory}: any) => {
  return (
    <ReactoryContext.Provider value={reactory}>
      {Children.only(children)}
    </ReactoryContext.Provider>
  );
};

export const withApi = (
  ComponentToWrap: any | React.Component | Function,
  id = 'not-set',
) => {
  return (props: any) => {
    const reactory = useContext(ReactoryContext);

    try {
      return <ComponentToWrap {...props} reactory={reactory} />;
    } catch (error: any) {
      return (
        <View>
          Component: {id}: error: {error.message}
        </View>
      );
    }
  };
};

export const useReactory = () => {
  const reactory = useContext(ReactoryContext);
  return reactory;
};

export default ReactoryProvider;
