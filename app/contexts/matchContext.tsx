import { createContext, useState, useEffect, useContext } from "react";
import Swal from "sweetalert2";

interface Match {
  matchId: number;
  state: "waiting" | "playing" | "finished" | "cancelled";
  player1Id: number;
  player2Id: number;
  player1Score: number;
  player2Score: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MatchFull extends Match {
  player1username: string;
  player2username: string;
  player1IconNumber: number;
  player2IconNumber: number;
}

interface MatchContextType {
  match: Match | null | undefined;
  createMatch: (player1Id: number) => Promise<number>;
  finishMatch: () => Promise<void>;
  cancelMatch: () => Promise<void>;
  getAllSlots: () => Promise<any[]>;
  getCurrentMatch: () => Promise<void>;
  flipSlot: (slotId: number) => Promise<void>;
  resetSlots: (slotIds: number[]) => Promise<void>;
  markSlotsAsMatched: (slotIds: number[]) => Promise<void>;
}

const MatchContext = createContext<MatchContextType | null>(null);

export const MatchProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    cancelMatch(); // Cancel any existing match on mount
  }, []);

  const [match, setMatch] = useState<MatchFull | Match | null | undefined>(
    undefined
  );

  const createMatch = async (player1Id: number) => {
    const res = await fetch("/api/match?action=create", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ player1Id }),
    });
    if (res.ok) {
      const data = await res.json();
      setMatch(data);
      return data.matchId;
    }
    return "";
  };

  const getCurrentMatch = async () => {
    const res = await fetch(`/api/match?action=get-current-match`, {
      method: "GET",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setMatch(data);
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo obtener la información del juego. Por favor, recarga la página e intenta de nuevo.",
      });
      setMatch(null);
    }
  };

  const getAllSlots = async () => {
    const res = await fetch(`/api/match?action=get-all-slots`, {
      method: "GET",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo obtener la información de las ranuras. Por favor, recarga la página e intenta de nuevo.",
      });
      return [];
    }
  };

  const finishMatch = async () => {
    const res = await fetch("/api/match?action=finish", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      setMatch(null);
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo finalizar el juego. Por favor, recarga la página e intenta de nuevo.",
      });
      setMatch(null);
    }
  };

  const cancelMatch = async () => {
    const res = await fetch("/api/match?action=cancel", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      setMatch(null);
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cancelar el juego. Por favor, recarga la página e intenta de nuevo.",
      });
    }
  };

  const flipSlot = async (slotId: number) => {
    await fetch("/api/match?action=flip-slot", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ slotId }),
    });
  };

  const resetSlots = async (slotIds: number[]) => {
    await fetch("/api/match?action=reset-slots", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ slotIds }),
    });
  };

  const markSlotsAsMatched = async (slotIds: number[]) => {
    await fetch("/api/match?action=mark-slots-as-matched", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ slotIds }),
    });
  };

  return (
    <MatchContext.Provider
      value={{
        match,
        createMatch,
        getCurrentMatch,
        finishMatch,
        cancelMatch,
        getAllSlots,
        flipSlot,
        resetSlots,
        markSlotsAsMatched,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};

export const useMatch = () => {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error("useMatch must be used within a MatchProvider");
  }
  return context;
};
