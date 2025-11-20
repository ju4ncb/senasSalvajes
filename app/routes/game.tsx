import { useGuestUser } from "~/contexts/guestUserContext";
import { useMatch } from "~/contexts/matchContext";
import type { Route } from "./+types/game";
import InfoCard from "~/components/InfoCard";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { LoadingScreen } from "~/components/LoadingScreen";
import { useNavigate } from "react-router";

import { Play, Trophy, X } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Memoria de Señas" },
    {
      name: "description",
      content: "¡Bienvenido al juego de Memoria de Señas!",
    },
  ];
}

const ProfileCard = ({
  username,
  profileIconNumber,
}: {
  username: string;
  profileIconNumber: number;
}) => {
  return (
    <div
      className="flex flex-col items-center bg-white/20 text-red-50 p-4 rounded-lg shadow-lg my-4"
      style={{ width: "min(600px, 90%)" }}
    >
      <div className="flex flex-col sm:flex-row items-center space-x-2 sm:space-x-4 gap-2">
        <img
          src={`/assets/profile-icons/icon-${profileIconNumber}.png`}
          alt={`${username}'s profile icon`}
          className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full"
        />
        <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
          {username}
        </span>
      </div>
    </div>
  );
};

const Leaderboard = () => {
  const [topPlayers, setTopPlayers] = useState<
    Array<{ username: string; score: number }>
  >([]);

  useEffect(() => {
    const fetchTopPlayers = async () => {
      const response = await fetch("/api/leaderboard");
      if (response.ok) {
        const data = await response.json();
        setTopPlayers(data.topPlayers);
      }
    };
    fetchTopPlayers();
  }, []);

  if (topPlayers.length === 0) {
    return (
      <div
        className="flex flex-col items-center mt-6 text-red-100"
        style={{ width: "min(600px, 90%)" }}
      >
        <h2 className="text-xl font-bold mb-2 border-b border-red-100 w-full text-center pb-2">
          <span>Leaderboard</span>
          <Trophy className="inline-block ml-2 text-yellow-400" />
        </h2>
        <ul className="mt-4 bg-white/20 text-red-50 p-4 rounded-lg shadow-lg w-full mx-auto">
          <li>No hay jugadores en el leaderboard aún.</li>
        </ul>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center mt-6 text-red-100"
      style={{ width: "min(600px, 90%)" }}
    >
      <h2 className="text-xl font-bold mb-2 border-b border-red-100 w-full text-center pb-2">
        <span>Leaderboard</span>
        <Trophy className="inline-block ml-2 text-yellow-400" />
      </h2>
      <ul className="mt-4 bg-white/10 text-red-50 p-4 rounded-lg shadow-lg w-full mx-auto">
        {topPlayers.map((player, index) => (
          <li
            key={index}
            className={`mb-2 ${index % 2 === 0 ? "bg-white/10" : ""}`}
          >
            {player.username}: {player.score}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function Game() {
  const { guestUser, verifyIfInMatch, verifyIfSomeoneJoined, joinMatch } =
    useGuestUser();

  const { cancelMatch, createMatch } = useMatch();

  if (!guestUser) {
    return <LoadingScreen />;
  }

  const navigate = useNavigate();

  const { userId, username, randomProfileIconNumber } = guestUser ?? {
    userId: -1,
    username: "Mistery Guy",
    randomProfileIconNumber: 3,
  };

  const [matchIdCreated, setMatchIdCreated] = useState<number>(-1);
  const [matchIdJoined, setMatchIdJoined] = useState<number>(-1);
  const [isLookingForMatch, setIsLookingForMatch] = useState<boolean>(false);

  useEffect(() => {
    // Check if the guest user is already in a match
    setIsLookingForMatch(true);
    const checkMatchStatus = async () => {
      const matchId = await verifyIfInMatch();
      setMatchIdJoined(matchId);
      setIsLookingForMatch(false);
    };
    checkMatchStatus();
  }, []);

  // If looking for match, repeatedly verify if someone joined
  useEffect(() => {
    console.log(
      "isLookingForMatch:",
      isLookingForMatch,
      "matchIdCreated:",
      matchIdCreated
    );
    if (!isLookingForMatch || matchIdCreated === -1) return;
    const interval = setInterval(async () => {
      const matchId = await verifyIfSomeoneJoined();
      if (matchId !== -1) {
        setMatchIdJoined(matchId);
        setIsLookingForMatch(false);
        navigate(`/match/${matchId}`);
      }
    }, 500); // Check every 500 milliseconds

    return () => clearInterval(interval);
  }, [isLookingForMatch, matchIdCreated]);

  const handleMatchButtonClick = async () => {
    setIsLookingForMatch(true);
    // If already in a match, redirect to that match
    if (matchIdJoined !== -1) {
      navigate(`/match/${matchIdJoined}`);
      return;
    }
    // Otherwise, see if there is any available match to join
    const res = await fetch(`/api/match?action=find`, {
      method: "GET",
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      if (data.matchId) {
        await joinMatch();
        navigate(`/match/${data.matchId}`);
        return;
      }
    }

    // If no available match, create a new one
    const matchId = await createMatch(userId);
    if (!matchId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo crear la partida. Por favor, intenta nuevamente.",
      });
      setIsLookingForMatch(false);
    }
    setMatchIdCreated(Number(matchId));
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center bg-custom text-white p-4 justify-start fade-in">
      <ProfileCard
        username={username}
        profileIconNumber={randomProfileIconNumber}
      />
      <InfoCard
        title={`¡Bienvenido, ${username}!`}
        content="Desafía a otro jugador en tiempo real en nuestro juego de memoria con lengua de señas. Pon a prueba tu memoria y aprende mientras juegas. Presiona el botón para buscar una partida."
      />
      {isLookingForMatch ? (
        <>
          <div className="mt-8 flex flex-col items-center">
            <p className="mb-4 text-lg sm:text-xl font-medium">
              Buscando partida...
            </p>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500"></div>
          </div>
          {matchIdCreated !== -1 && (
            <button
              className="mt-8 px-6 sm:px-12 py-3 sm:py-5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-lg sm:text-2xl font-bold rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-red-500/50 cursor-pointer border-2 border-red-400 w-[90%] sm:w-auto max-w-[600px]"
              onClick={async () => {
                setIsLookingForMatch(false);
                cancelMatch();
              }}
            >
              <X size={24} className="inline-block mr-2 sm:w-8 sm:h-8" />
              <span className="text-xl sm:text-2xl font-bold">Cancelar</span>
            </button>
          )}
        </>
      ) : (
        <button
          onClick={handleMatchButtonClick}
          className="mt-8 px-6 sm:px-12 py-3 sm:py-5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-lg sm:text-2xl font-bold rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-red-500/50 cursor-pointer border-2 border-red-400 w-[90%] sm:w-auto max-w-[600px]"
        >
          <Play size={24} className="inline-block mr-2 sm:w-8 sm:h-8" />
          <span className="text-xl sm:text-2xl font-bold">
            {matchIdJoined !== -1 ? "Volver a la partida" : "Buscar partida"}
          </span>
        </button>
      )}
      <Leaderboard />
    </div>
  );
}
