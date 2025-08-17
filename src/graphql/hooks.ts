import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  GET_USER_PROFILE,
  GET_USERS,
  UPDATE_USER_PROFILE,
  LOGIN_USER,
  USER_UPDATED_SUBSCRIPTION,
} from './operations';
import {
  GetUserProfileQuery,
  GetUserProfileVariables,
  GetUsersQuery,
  GetUsersVariables,
  UpdateUserProfileMutation,
  UpdateUserProfileVariables,
  LoginUserMutation,
  LoginUserVariables,
  UserUpdatedSubscription,
  UserUpdatedSubscriptionVariables,
} from './types';

// Custom hooks for GraphQL operations

export const useGetUserProfile = (userId: string) => {
  return useQuery<GetUserProfileQuery, GetUserProfileVariables>(
    GET_USER_PROFILE,
    {
      variables: { userId },
      skip: !userId,
    }
  );
};

export const useGetUsers = (limit?: number, offset?: number) => {
  return useQuery<GetUsersQuery, GetUsersVariables>(GET_USERS, {
    variables: { limit, offset },
  });
};

export const useUpdateUserProfile = () => {
  return useMutation<UpdateUserProfileMutation, UpdateUserProfileVariables>(
    UPDATE_USER_PROFILE,
    {
      // Automatically refetch user profile after update
      refetchQueries: ['GetUserProfile'],
    }
  );
};

export const useLoginUser = () => {
  return useMutation<LoginUserMutation, LoginUserVariables>(LOGIN_USER);
};

export const useUserUpdatedSubscription = (userId: string) => {
  return useSubscription<UserUpdatedSubscription, UserUpdatedSubscriptionVariables>(
    USER_UPDATED_SUBSCRIPTION,
    {
      variables: { userId },
      skip: !userId,
    }
  );
};
