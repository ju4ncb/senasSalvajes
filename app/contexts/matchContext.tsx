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
}

interface MatchContextType {
  match: Match | null | undefined;
  createMatch: (player1Id: number) => Promise<number>;
  finishMatch: (matchId: number) => Promise<void>;
  cancelMatch: (matchId: number) => Promise<void>;
  getCurrentMatch: () => Promise<void>;
}

const MatchContext = createContext<MatchContextType | null>(null);

export const MatchProvider = ({ children }: { children: React.ReactNode }) => {
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

  const finishMatch = async (matchId: number) => {
    const res = await fetch("/api/match?action=finish", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ matchId }),
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

  const cancelMatch = async (matchId: number) => {
    const res = await fetch("/api/match?action=cancel", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ matchId }),
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

  return (
    <MatchContext.Provider
      value={{ match, createMatch, getCurrentMatch, finishMatch, cancelMatch }}
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
