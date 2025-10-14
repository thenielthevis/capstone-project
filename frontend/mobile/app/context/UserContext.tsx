import React, { createContext, useState, useContext, useEffect } from "react";
import { tokenStorage } from "../../utils/tokenStorage";

const UserContext = createContext<any>(null);

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

export const useUser = () => useContext(UserContext);
export default UserProvider;