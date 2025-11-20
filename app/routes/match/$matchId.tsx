import { useParams } from "react-router";
import { useState, useEffect } from "react";
import { useMatch } from "~/contexts/matchContext";
import { LoadingScreen } from "~/components/LoadingScreen";

interface Match {
  matchId: number;
  state: "waiting" | "playing" | "finished";
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

export default function MatchPage() {
  const { matchId } = useParams(); // obtiene el valor dinámico de la URL
  const { match, getMatchById } = useMatch();
  const [currentMatch, setCurrentMatch] = useState<MatchFull | null>(null);

  useEffect(() => {
    if (!match && matchId) {
      getMatchById(Number(matchId));
    }
  }, [matchId]);

  useEffect(() => {
    if (match) {
      setCurrentMatch(match as MatchFull);
    }
  }, [match]);

  if (!currentMatch) {
    return <LoadingScreen />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Match Details</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-center flex-1">
            <h2 className="text-2xl font-semibold">
              {currentMatch.player1username}
            </h2>
            <p className="text-4xl font-bold mt-2">
              {currentMatch.player1Score}
            </p>
          </div>

          <div className="text-center px-4">
            <span className="text-xl font-bold">VS</span>
          </div>

          <div className="text-center flex-1">
            <h2 className="text-2xl font-semibold">
              {currentMatch.player2username}
            </h2>
            <p className="text-4xl font-bold mt-2">
              {currentMatch.player2Score}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Status:{" "}
            <span className="font-semibold capitalize">
              {currentMatch.state}
            </span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Tiempo pasado:{" "}
            {(() => {
              const totalSeconds = Math.floor(
                (new Date().getTime() -
                  new Date(currentMatch.updatedAt).getTime()) /
                  1000
              );
              const minutes = Math.floor(totalSeconds / 60);
              const seconds = totalSeconds % 60;
              return `${minutes}:${seconds.toString().padStart(2, "0")}`;
            })()}
          </p>
        </div>
      </div>

      {/* Aquí estará el grid 5x5 de cartas */}
    </div>
  );
}
