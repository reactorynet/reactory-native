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
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Details'>;

const DetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const { title } = route.params || {};

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
            Details Screen
          </Text>
          
          {title && (
            <View style={styles.paramSection}>
              <Text style={[styles.paramLabel, textStyle]}>
                Received parameter:
              </Text>
              <Text style={[styles.paramValue, textStyle]}>
                {title}
              </Text>
            </View>
          )}

          <View style={styles.infoSection}>
            <Text style={[styles.sectionTitle, textStyle]}>
              📱 Navigation Features
            </Text>
            <Text style={[styles.feature, textStyle]}>
              ✅ Stack Navigation
            </Text>
            <Text style={[styles.feature, textStyle]}>
              ✅ Type-safe parameters
            </Text>
            <Text style={[styles.feature, textStyle]}>
              ✅ Custom header styling
            </Text>
            <Text style={[styles.feature, textStyle]}>
              ✅ Back navigation
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>← Go Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.homeButton]}
            onPress={() => navigation.navigate('Home')}>
            <Text style={styles.buttonText}>🏠 Go to Home</Text>
          </TouchableOpacity>
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
  paramSection: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#e8f5e8',
    marginBottom: 32,
  },
  paramLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2e7d32',
  },
  paramValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  infoSection: {
    marginBottom: 32,
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
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#757575',
  },
  homeButton: {
    backgroundColor: '#6200ee',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DetailsScreen;
