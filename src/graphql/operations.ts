import { gql } from '@apollo/client';

// Example user queries
export const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: ID!) {
    user(id: $userId) {
      id
      email
      name
      avatar
      createdAt
      updatedAt
    }
  }
`;

export const GET_USERS = gql`
  query GetUsers($limit: Int, $offset: Int) {
    users(limit: $limit, offset: $offset) {
      id
      email
      name
      avatar
      createdAt
    }
  }
`;

// Example mutations
export const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
      email
      name
      avatar
      updatedAt
    }
  }
`;

export const LOGIN_USER = gql`
  mutation LoginUser($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
        avatar
      }
    }
  }
`;

// Example subscriptions
export const USER_UPDATED_SUBSCRIPTION = gql`
  subscription UserUpdated($userId: ID!) {
    userUpdated(userId: $userId) {
      id
      email
      name
      avatar
      updatedAt
    }
  }
`;
