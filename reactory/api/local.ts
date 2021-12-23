import LocalStorage from '@react-native-community/async-storage';

export const anonUser = {
  id: '',
  firstName: '',
  lastName: '',
  avatar: '',
  anon: true,
  roles: ['ANON'],
};

export const storageKeys = {
  LoggedInUser: 'loggedInUser',
  AuthToken: 'auth_token',
  LastLoggedInEmail: '$reactory$last_logged_in_user',
  viewContext: '$rectory$viewContext',
};

export const ReactoryLoggedInUser = async () => {
  const userString = await LocalStorage.getItem(storageKeys.LoggedInUser);
  if (userString) {
    try {
      let parsedUser = JSON.parse(userString);
      return parsedUser;
    } catch (parseError) {
      return anonUser;
    }
  }
  return anonUser;
};
