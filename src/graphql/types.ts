// GraphQL Type definitions for TypeScript
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateUserInput {
  id: string;
  name?: string;
  avatar?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Query variables types
export interface GetUserProfileVariables {
  userId: string;
}

export interface GetUsersVariables {
  limit?: number;
  offset?: number;
}

export interface UpdateUserProfileVariables {
  input: UpdateUserInput;
}

export interface LoginUserVariables {
  email: string;
  password: string;
}

export interface UserUpdatedSubscriptionVariables {
  userId: string;
}

// Query response types
export interface GetUserProfileQuery {
  user: User;
}

export interface GetUsersQuery {
  users: User[];
}

export interface UpdateUserProfileMutation {
  updateUser: User;
}

export interface LoginUserMutation {
  login: LoginResponse;
}

export interface UserUpdatedSubscription {
  userUpdated: User;
}
