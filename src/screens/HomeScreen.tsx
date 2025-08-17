import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Button,
  FAB,
  Chip,
  useTheme,
  Snackbar,
  IconButton,
  Surface,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../store';
import { increment, decrement, reset } from '../store/slices/counterSlice';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Icon components defined outside of render
const CounterIcon = (props: any) => <IconButton {...props} icon="counter" />;
const StarIcon = (props: any) => <IconButton {...props} icon="star" />;
const NavigationIcon = (props: any) => <IconButton {...props} icon="navigation" />;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const count = useAppSelector((state) => state.counter.value);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const handleIncrement = () => {
    dispatch(increment());
    setSnackbarVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Card */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              Welcome to Reactory Native! 🚀
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Modern React Native with Material Design
            </Text>
          </Card.Content>
        </Card>

        {/* Counter Card */}
        <Card style={styles.card}>
          <Card.Title
            title="Redux Counter Demo"
            subtitle="State management with Redux Toolkit"
            left={CounterIcon}
          />
          <Card.Content>
            <Surface style={styles.counterDisplay}>
              <Text variant="displaySmall" style={styles.counterText}>
                {count}
              </Text>
            </Surface>
            
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={handleIncrement}
                style={styles.button}
                icon="plus">
                Increment
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => dispatch(decrement())}
                style={styles.button}
                icon="minus">
                Decrement
              </Button>
              
              <Button
                mode="text"
                onPress={() => dispatch(reset())}
                style={styles.button}
                icon="refresh">
                Reset
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Features Card */}
        <Card style={styles.card}>
          <Card.Title
            title="Integrated Technologies"
            subtitle="Modern React Native stack"
            left={StarIcon}
          />
          <Card.Content>
            <View style={styles.chipContainer}>
              <Chip icon="language-typescript" style={styles.chip}>TypeScript</Chip>
              <Chip icon="redux" style={styles.chip}>Redux Toolkit</Chip>
              <Chip icon="navigation" style={styles.chip}>React Navigation</Chip>
              <Chip icon="graphql" style={styles.chip}>Apollo GraphQL</Chip>
              <Chip icon="material-design" style={styles.chip}>Material Design</Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Navigation Card */}
        <Card style={styles.card}>
          <Card.Title
            title="Navigation Demo"
            subtitle="Type-safe navigation"
            left={NavigationIcon}
          />
          <Card.Content>
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Details', { title: 'Hello from Home!' })}
                style={styles.navButton}
                icon="arrow-right">
                Details Screen
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('GraphQLDemo')}
                style={styles.navButton}
                icon="graphql">
                GraphQL Demo
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleIncrement}
        label="Add"
      />

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        action={{
          label: 'Undo',
          onPress: () => dispatch(decrement()),
        }}>
        Counter incremented! Current value: {count}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for FAB
  },
  welcomeCard: {
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
  counterDisplay: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  counterText: {
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    minWidth: 100,
  },
  fullButton: {
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  navButton: {
    flex: 1,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

export default HomeScreen;
