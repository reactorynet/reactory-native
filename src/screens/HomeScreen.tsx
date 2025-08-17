import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store';
import { increment, decrement, reset } from '../store/slices/counterSlice';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const dispatch = useAppDispatch();
  const count = useAppSelector((state) => state.counter.value);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    flex: 1,
  };

  const textStyle = {
    color: isDarkMode ? '#ffffff' : '#000000',
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View style={styles.container}>
          <Text style={[styles.title, textStyle]}>
            Welcome to Reactory Native!
          </Text>
          
          <View style={styles.counterSection}>
            <Text style={[styles.counterTitle, textStyle]}>
              Redux Counter Example
            </Text>
            <Text style={[styles.counterValue, textStyle]}>
              Count: {count}
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.incrementButton]}
                onPress={() => dispatch(increment())}>
                <Text style={styles.buttonText}>+</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.decrementButton]}
                onPress={() => dispatch(decrement())}>
                <Text style={styles.buttonText}>-</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.resetButton]}
                onPress={() => dispatch(reset())}>
                <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.navigationButton]}
            onPress={() => navigation.navigate('Details', { title: 'Hello from Home!' })}>
            <Text style={styles.buttonText}>Go to Details</Text>
          </TouchableOpacity>
          
          <View style={styles.infoSection}>
            <Text style={[styles.sectionTitle, textStyle]}>
              🚀 Modern React Native Features
            </Text>
            <Text style={[styles.feature, textStyle]}>
              ✅ TypeScript support
            </Text>
            <Text style={[styles.feature, textStyle]}>
              ✅ Redux Toolkit for state management
            </Text>
            <Text style={[styles.feature, textStyle]}>
              ✅ React Navigation for routing
            </Text>
            <Text style={[styles.feature, textStyle]}>
              ✅ ESLint & Prettier configured
            </Text>
            <Text style={[styles.feature, textStyle]}>
              ✅ Jest testing setup
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  counterSection: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  counterTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  counterValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  incrementButton: {
    backgroundColor: '#4CAF50',
  },
  decrementButton: {
    backgroundColor: '#f44336',
  },
  resetButton: {
    backgroundColor: '#2196F3',
  },
  navigationButton: {
    backgroundColor: '#6200ee',
    marginBottom: 32,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  feature: {
    fontSize: 16,
    marginBottom: 8,
    paddingLeft: 8,
  },
});

export default HomeScreen;
