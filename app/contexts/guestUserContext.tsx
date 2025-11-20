import { createContext, useState, useEffect, useContext } from "react";
import Swal from "sweetalert2";

interface GuestUser {
  userId: number;
  username: string;
  randomProfileIconNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

interface GuestUserContextType {
  guestUser: GuestUser | null | undefined;
  login: () => void;
  logout: () => void;
  verifyIfInMatch: () => Promise<number>;
  verifyIfSomeoneJoined: () => Promise<number>;
  joinMatch: (matchId: string) => Promise<void>;
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

  const joinMatch = async (matchId: string) => {
    if (!guestUser) return;
    const res = await fetch("/api/match?action=join", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ matchId }),
    });
    if (!res.ok) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo unir al juego. Por favor, intenta de nuevo.",
      });
    }
  };

  const verifyIfInMatch = async () => {
    if (!guestUser) return -1;
    const res = await fetch("/api/match?action=verify-in-match", {
      method: "GET",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      return data.matchId as number;
    }
    return -1;
  };

  const verifyIfSomeoneJoined = async () => {
    if (!guestUser) return -1;
    const res = await fetch("/api/match?action=verify-someone-joined", {
      method: "GET",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      return data.matchId as number;
    }
    return -1;
  };

  const verifyGuestUser = async () => {
    const res = await fetch("/api/verify", {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      setGuestUser({
        userId: data.userId,
        username: data.username,
        randomProfileIconNumber: data.randomProfileIconNumber,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
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
      value={{
        guestUser: guestUser,
        verifyIfInMatch,
        verifyIfSomeoneJoined,
        login: verifyGuestUser,
        logout,
        joinMatch,
      }}
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
