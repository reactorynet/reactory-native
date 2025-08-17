import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Button,
  useTheme,
  ActivityIndicator,
  IconButton,
  TextInput,
  Snackbar,
} from 'react-native-paper';
import { useQuery, useMutation } from '@apollo/client';
import { GET_USERS, LOGIN_USER } from '../graphql/operations';
import {
  GetUsersQuery,
  GetUsersVariables,
  LoginUserMutation,
  LoginUserVariables,
} from '../graphql/types';

// Icon components
const GraphQLIcon = (props: any) => <IconButton {...props} icon="graphql" />;
const UserIcon = (props: any) => <IconButton {...props} icon="account" />;

const GraphQLDemoScreen: React.FC = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // GraphQL Query Example
  const { data, loading, error, refetch } = useQuery<GetUsersQuery, GetUsersVariables>(
    GET_USERS,
    {
      variables: { limit: 10 },
      // Comment out since we don't have a real GraphQL endpoint
      // errorPolicy: 'all',
      skip: true, // Skip the query for demo purposes
    }
  );

  // GraphQL Mutation Example
  const [loginUser, { loading: loginLoading }] = useMutation<
    LoginUserMutation,
    LoginUserVariables
  >(LOGIN_USER, {
    onCompleted: (loginData) => {
      setSnackbarMessage(`Login successful! Token: ${loginData.login.token.substring(0, 20)}...`);
      setSnackbarVisible(true);
    },
    onError: (loginError) => {
      setSnackbarMessage(`Login failed: ${loginError.message}`);
      setSnackbarVisible(true);
    },
  });

  const handleLogin = async () => {
    try {
      await loginUser({
        variables: { email, password },
      });
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleRefresh = () => {
    refetch();
    setSnackbarMessage('Data refreshed!');
    setSnackbarVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              Apollo GraphQL Demo 🚀
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Showcasing GraphQL integration with Apollo Client
            </Text>
          </Card.Content>
        </Card>

        {/* Query Example */}
        <Card style={styles.card}>
          <Card.Title
            title="GraphQL Query Example"
            subtitle="Fetching users from GraphQL API"
            left={GraphQLIcon}
          />
          <Card.Content>
            <View style={styles.querySection}>
              <Text variant="bodyMedium" style={styles.description}>
                This demonstrates a GraphQL query using Apollo Client hooks.
                The query is currently disabled for demo purposes.
              </Text>
              
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" />
                  <Text variant="bodyMedium" style={styles.loadingText}>
                    Loading users...
                  </Text>
                </View>
              )}
              
              {error && (
                <Text variant="bodyMedium" style={styles.errorText}>
                  Error: {error.message}
                </Text>
              )}
              
              {data && (
                <View style={styles.dataContainer}>
                  <Text variant="titleMedium">Users loaded: {data.users.length}</Text>
                  {data.users.slice(0, 3).map((user) => (
                    <Text key={user.id} variant="bodyMedium">
                      • {user.name} ({user.email})
                    </Text>
                  ))}
                </View>
              )}
              
              <Button
                mode="outlined"
                onPress={handleRefresh}
                disabled={loading}
                style={styles.refreshButton}
                icon="refresh">
                Refresh Data
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Mutation Example */}
        <Card style={styles.card}>
          <Card.Title
            title="GraphQL Mutation Example"
            subtitle="User authentication with mutations"
            left={UserIcon}
          />
          <Card.Content>
            <View style={styles.mutationSection}>
              <Text variant="bodyMedium" style={styles.description}>
                This demonstrates a GraphQL mutation for user login.
              </Text>
              
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
              
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />
              
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loginLoading}
                disabled={loginLoading}
                style={styles.loginButton}
                icon="login">
                {loginLoading ? 'Logging in...' : 'Login (Demo)'}
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* GraphQL Features */}
        <Card style={styles.card}>
          <Card.Title
            title="Apollo Client Features"
            subtitle="Integrated GraphQL capabilities"
          />
          <Card.Content>
            <View style={styles.featureList}>
              <Text variant="bodyMedium" style={styles.feature}>
                ✅ Declarative data fetching with useQuery
              </Text>
              <Text variant="bodyMedium" style={styles.feature}>
                ✅ Mutations with useMutation hook
              </Text>
              <Text variant="bodyMedium" style={styles.feature}>
                ✅ Automatic caching and cache updates
              </Text>
              <Text variant="bodyMedium" style={styles.feature}>
                ✅ Error handling and loading states
              </Text>
              <Text variant="bodyMedium" style={styles.feature}>
                ✅ TypeScript integration for type safety
              </Text>
              <Text variant="bodyMedium" style={styles.feature}>
                ✅ Optimistic UI updates
              </Text>
              <Text variant="bodyMedium" style={styles.feature}>
                ✅ Real-time subscriptions support
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}>
        {snackbarMessage}
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
  querySection: {
    gap: 12,
  },
  mutationSection: {
    gap: 12,
  },
  description: {
    opacity: 0.8,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    opacity: 0.7,
  },
  errorText: {
    color: '#f44336',
  },
  dataContainer: {
    gap: 4,
  },
  refreshButton: {
    marginTop: 8,
  },
  input: {
    marginBottom: 8,
  },
  loginButton: {
    marginTop: 8,
  },
  featureList: {
    gap: 8,
  },
  feature: {
    paddingLeft: 8,
    lineHeight: 20,
  },
});

export default GraphQLDemoScreen;
