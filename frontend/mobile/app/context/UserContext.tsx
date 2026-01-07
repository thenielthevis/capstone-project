import React, { createContext, useState, useContext, useEffect } from "react";
import { tokenStorage } from "../../utils/tokenStorage";

const UserContext = createContext<any>({ user: null, setUser: () => {} });

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Restore user from Secure Store on mount
    const restoreUser = async () => {
      const storedUser = await tokenStorage.getUser();
      if (storedUser) setUser(storedUser);
    };
    restoreUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    console.warn('[UserContext] useUser called outside of UserProvider');
    return { user: null, setUser: () => {} };
  }
  return context;
};
export default UserProvider;