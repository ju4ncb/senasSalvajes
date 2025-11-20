import { createContext, useState, useEffect, useContext } from "react";

interface GuestUser {
  username: string;
  randomProfileIconNumber: string;
}

interface GuestUserContextType {
  user: GuestUser | null | undefined;
  login: () => void;
  logout: () => void;
}

const GuestUserContext = createContext<GuestUserContextType | null>(null);

export const GuestUserProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [guestUser, setGuestUser] = useState<GuestUser | null | undefined>(
    undefined
  );

  useEffect(() => {
    verifyGuestUser();
  }, []);

  const verifyGuestUser = async () => {
    const res = await fetch("/api/verify", {
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      setGuestUser({
        username: data.username,
        randomProfileIconNumber: data.randomProfileIconNumber,
      });
    } else {
      setGuestUser(null);
    }
  };

  const logout = async () => {
    await fetch("/logout", {
      method: "POST",
      credentials: "include", // 🔑 so backend can clear cookie
    });

    setGuestUser(null);
  };

  return (
    <GuestUserContext.Provider
      value={{ user: guestUser, login: verifyGuestUser, logout }}
    >
      {children}
    </GuestUserContext.Provider>
  );
};

export const useGuestUser = (): GuestUserContextType => {
  const context = useContext(GuestUserContext);
  if (!context) {
    throw new Error("useGuestUser must be used within a GuestUserProvider");
  }
  return context;
};
