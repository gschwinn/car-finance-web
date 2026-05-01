import { type ReactNode, useEffect, useMemo, useState, createContext } from 'react';

export type UserProfile = {
  id: string;
  email: string;
  authenticated: boolean;
}

export type UserContextValue = {
  profile?: any;
  loggedIn: boolean;
  loading: boolean;
  handleLogin: (isSignup: boolean) => void;
  handleLogout: () => void;
};

export const UserContext = createContext<UserContextValue>({
  loading: true,
  loggedIn: false,
  handleLogin: () => {
    return;
  },
  handleLogout: () => {
    return;
  },
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>();
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const profile = await getProfile();
        setLoggedIn(profile.authenticated);
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to load profile', error);
        setLoggedIn(false);
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleLogin = (isSignup: boolean) => {
    window.location.href = `/api/login${isSignup ? '?signup=true' : ''}`;
  };

  const handleLogout = () => {
    window.location.href = `/api/logout`;
  };

  const userContext = useMemo(
    () => ({
      userProfile,
      loggedIn,
      loading,
      handleLogin,
      handleLogout,
    }),
    [userProfile, loggedIn, loading],
  );

  return (
    <UserContext.Provider
      value={userContext}
    >
      {children}
    </UserContext.Provider>
  );
};

const getProfile = async (): Promise<UserProfile> => {
  await new Promise((resolve) => {
    setTimeout(() => (resolve(true)), 1000)
  })

  return {
    id: '',
    email: '',
    authenticated: true,
  }
}