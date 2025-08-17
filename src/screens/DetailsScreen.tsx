import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Button,
  useTheme,
  Surface,
  IconButton,
} from 'react-native-paper';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Details'>;

// Icon components defined outside of render
const DetailsIcon = (props: any) => <IconButton {...props} icon="information" />;
const NavigationIcon = (props: any) => <IconButton {...props} icon="navigation" />;

const DetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const { title } = route.params || {};

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              Details Screen 📱
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Demonstrating React Native Paper components
            </Text>
          </Card.Content>
        </Card>

        {/* Parameter Card */}
        {title && (
          <Card style={styles.card}>
            <Card.Title
              title="Navigation Parameter"
              subtitle="Received from previous screen"
              left={DetailsIcon}
            />
            <Card.Content>
              <Surface style={styles.parameterDisplay}>
                <Text variant="bodyLarge" style={styles.parameterLabel}>
                  Received parameter:
                </Text>
                <Text variant="titleLarge" style={styles.parameterValue}>
                  "{title}"
                </Text>
              </Surface>
            </Card.Content>
          </Card>
        )}

        {/* Features Card */}
        <Card style={styles.card}>
          <Card.Title
            title="Navigation Features"
            subtitle="Type-safe navigation system"
            left={NavigationIcon}
          />
          <Card.Content>
            <View style={styles.featureList}>
              <Text variant="bodyMedium" style={styles.feature}>
                ✅ Stack Navigation with React Navigation 7
              </Text>
              <Text variant="bodyMedium" style={styles.feature}>
                ✅ Type-safe parameter passing
              </Text>
              <Text variant="bodyMedium" style={styles.feature}>
                ✅ Custom header styling with Material Design
              </Text>
              <Text variant="bodyMedium" style={styles.feature}>
                ✅ Programmatic navigation control
              </Text>
              <Text variant="bodyMedium" style={styles.feature}>
                ✅ Back navigation handling
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Navigation Controls */}
        <Card style={styles.card}>
          <Card.Title
            title="Navigation Controls"
            subtitle="Navigate between screens"
          />
          <Card.Content>
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.button}
                icon="arrow-left">
                Go Back
              </Button>

              <Button
                mode="contained"
                onPress={() => navigation.navigate('Home')}
                style={styles.button}
                icon="home">
                Go to Home
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  parameterDisplay: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  parameterLabel: {
    marginBottom: 8,
    opacity: 0.8,
  },
  parameterValue: {
    fontWeight: 'bold',
  },
  featureList: {
    gap: 8,
  },
  feature: {
    paddingLeft: 8,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
});

export default DetailsScreen;
