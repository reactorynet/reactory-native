/**
 * Mock for @react-navigation/drawer
 */
import React from 'react';

const createDrawerNavigator = () => ({
  Navigator: ({ children }) => children,
  Screen: ({ children, component: Component }) => Component ? <Component /> : children,
});

const DrawerScreenProps = {};

module.exports = {
  createDrawerNavigator,
  DrawerScreenProps,
};
