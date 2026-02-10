/**
 * Mock for @react-navigation/bottom-tabs
 */
import React from 'react';

const createBottomTabNavigator = () => ({
  Navigator: ({ children }) => children,
  Screen: ({ children, component: Component }) => Component ? <Component /> : children,
});

const BottomTabScreenProps = {};

module.exports = {
  createBottomTabNavigator,
  BottomTabScreenProps,
};
