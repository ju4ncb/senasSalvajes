import { useState, useEffect, use, useRef } from "react";
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

interface CardDetails {
  slotId: number;
  value: number;
  xPosition: number;
  yPosition: number;
  description: string;
  imageType: string;
  imageUrl: string;
  state: "hidden" | "revealed" | "matched";
}

interface MatchFull extends Match {
  player1username: string;
  player2username: string;
  player1IconNumber: number;
  player2IconNumber: number;
}

const PlayerVSPlayer = ({
  player1username,
  player2username,
  player1IconNumber,
  player2IconNumber,
  player1Score,
  player2Score,
  isItFirstPlayerTurn,
}: {
  player1username: string;
  player2username: string;
  player1IconNumber: number;
  player2IconNumber: number;
  player1Score: number;
  player2Score: number;
  isItFirstPlayerTurn: boolean;
}) => {
  const icon1 = `/assets/profile-icons/icon-${player1IconNumber}.png`;
  const icon2 = `/assets/profile-icons/icon-${player2IconNumber}.png`;

  const turnIndicatorPlayer1 = isItFirstPlayerTurn ? "⭐" : "";
  const turnIndicatorPlayer2 = !isItFirstPlayerTurn ? "⭐" : "";

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4 md:gap-6 w-full max-w-lg">
      <div className="flex flex-col items-center flex-1 min-w-0">
        <div className="relative">
          <img
            src={icon1}
            alt={`${player1username} Icon`}
            className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 sm:border-3 md:border-4 border-blue-500 shadow-lg"
          />
        </div>
        <h2 className="text-sm sm:text-lg md:text-xl font-bold mt-2 sm:mt-3 text-white truncate w-full text-center px-1">
          {player1username}
          {turnIndicatorPlayer1}
        </h2>
        <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-blue-400">
          {player1Score}
        </p>
      </div>

      <div className="flex flex-col items-center px-2 sm:px-4 md:px-6 flex-shrink-0">
        <span className="text-lg sm:text-xl md:text-2xl font-bold text-white/80 bg-white/10 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full">
          VS
        </span>
      </div>

      <div className="flex flex-col items-center flex-1 min-w-0">
        <div className="relative">
          <img
            src={icon2}
            alt={`${player2username} Icon`}
            className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 sm:border-3 md:border-4 border-red-500 shadow-lg"
          />
        </div>
        <h2 className="text-sm sm:text-lg md:text-xl font-bold mt-2 sm:mt-3 text-white truncate w-full text-center px-1">
          {player2username}
          {turnIndicatorPlayer2}
        </h2>
        <p className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 text-red-400">
          {player2Score}
        </p>
      </div>
    </div>
  );
};

const HeaderMatch = ({
  currentMatch,
  isItFirstPlayerTurn,
  player1Score,
  player2Score,
  finished,
}: {
  currentMatch: MatchFull;
  isItFirstPlayerTurn: boolean;
  player1Score: number;
  player2Score: number;
  finished: boolean;
}) => {
  return (
    <div className="flex flex-col lg:flex-row justify-around items-center gap-4 mb-4 bg-white/10 p-4 rounded-lg shadow-md">
      <div className="flex flex-col items-center mb-2 lg:mb-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-center lg:text-left">
          Detalles de la partida
        </h1>
        <h2>
          {finished
            ? `Partida terminada, ganador: ${
                isItFirstPlayerTurn
                  ? currentMatch.player1username
                  : currentMatch.player2username
              }`
            : `Turno de: ${
                isItFirstPlayerTurn
                  ? currentMatch.player1username
                  : currentMatch.player2username
              }`}
        </h2>
      </div>
      <PlayerVSPlayer
        player1username={currentMatch.player1username}
        player2username={currentMatch.player2username}
        player1IconNumber={currentMatch.player1IconNumber}
        player2IconNumber={currentMatch.player2IconNumber}
        player1Score={player1Score}
        player2Score={player2Score}
        isItFirstPlayerTurn={isItFirstPlayerTurn}
      />
      <div className="text-sm text-white/90 bg-white/10 px-3 py-1.5 rounded-full">
        <span className="font-semibold">Tiempo: </span>
        {(() => {
          const [elapsed, setElapsed] = useState(0);

          useEffect(() => {
            const interval = setInterval(() => {
              setElapsed(
                Math.floor(
                  (new Date().getTime() -
                    new Date(currentMatch.updatedAt).getTime()) /
                    1000
                )
              );
            }, 1000);

            return () => clearInterval(interval);
          }, [currentMatch.updatedAt]);

          const minutes = Math.floor(elapsed / 60);
          const seconds = elapsed % 60;
          return (
            <span className="font-mono font-bold text-white">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          );
        })()}
      </div>
    </div>
  );
};

const GridCards = ({
  cards,
  isItFirstPlayerTurn,
  amIPlayerOne,
  finished,
  setCards,
  flipSlot,
  resetSlots,
  markSlotsAsMatched,
  setMatched,
  setFinished,
  finishMatch,
}: {
  cards: CardDetails[][];
  isItFirstPlayerTurn: boolean;
  amIPlayerOne: boolean;
  finished: boolean;
  setCards: React.Dispatch<React.SetStateAction<CardDetails[][]>>;
  flipSlot: (slotId: number) => Promise<void>;
  resetSlots: (slotIds: number[]) => Promise<void>;
  markSlotsAsMatched: (slotIds: number[]) => Promise<void>;
  setMatched: React.Dispatch<React.SetStateAction<boolean>>;
  setFinished: React.Dispatch<React.SetStateAction<boolean>>;
  finishMatch: () => Promise<void>;
}) => {
  const [flippedCard1, setFlippedCard1] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [flippedCard2, setFlippedCard2] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const flippedRef = useRef({ flippedCard1, flippedCard2, cards });

  useEffect(() => {
    flippedRef.current = { flippedCard1, flippedCard2, cards };
  }, [flippedCard1, flippedCard2, cards]);

  useEffect(() => {
    return () => {
      const { flippedCard1, flippedCard2, cards } = flippedRef.current;

      const slotsToReset: number[] = [];
      if (flippedCard1) {
        slotsToReset.push(cards[flippedCard1.row][flippedCard1.col].slotId);
      }
      if (flippedCard2) {
        slotsToReset.push(cards[flippedCard2.row][flippedCard2.col].slotId);
      }

      if (slotsToReset.length > 0) {
        resetSlots(slotsToReset);
      }
    };
  }, []);

  const handleCardAction = async (index: number) => {
    // Find card in grid
    const row = Math.floor(index / cards[0].length);
    const col = index % cards[0].length;
    const card = cards[row][col];

    // Only allow action if card is hidden
    if (card.state !== "hidden") return;

    console.log("Card clicked:", card, flippedCard1, flippedCard2);

    // If both cards are already flipped, do nothing
    if (flippedCard1 && flippedCard2) return;

    // Check if it's the player's turn or if the game is finished
    if (
      finished ||
      (amIPlayerOne && !isItFirstPlayerTurn) ||
      (!amIPlayerOne && isItFirstPlayerTurn)
    ) {
      return;
    }

    // Reveal card
    const newCards = cards.map((r) => r.slice());
    newCards[row][col].state = "revealed";

    if (!flippedCard1) {
      setFlippedCard1({ row, col });
      await flipSlot(cards[row][col].slotId);
    } else if (!flippedCard2) {
      setFlippedCard2({ row, col });
      await flipSlot(cards[row][col].slotId);

      // Check for match
      const firstCard = newCards[flippedCard1.row][flippedCard1.col];
      const secondCard = newCards[row][col];
      if (firstCard.value === secondCard.value) {
        // It's a match
        setMatched(true);
        setTimeout(() => setMatched(false), 250);
        newCards[flippedCard1.row][flippedCard1.col].state = "matched";
        newCards[row][col].state = "matched";
        await markSlotsAsMatched([firstCard.slotId, secondCard.slotId]);
        setFlippedCard1(null);
        setFlippedCard2(null);

        // Check if all cards are matched
        const allMatched = newCards.every((r) =>
          r.every((c) => c.state === "matched")
        );
        if (allMatched) {
          setFinished(true);
          await finishMatch();
        }
      } else {
        // Not a match - hide cards after a delay
        await resetSlots([firstCard.slotId, secondCard.slotId]);
        setTimeout(() => {
          const resetCards = cards.map((r) => r.slice());
          resetCards[flippedCard1.row][flippedCard1.col].state = "hidden";
          resetCards[row][col].state = "hidden";
          setCards(resetCards);
          setFlippedCard1(null);
          setFlippedCard2(null);
        }, 1000);
      }
    }

    setCards(newCards);
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3 lg:gap-4 max-w-4xl mx-auto">
      {cards.flat().map(({ value, imageUrl, state }, index) => (
        <div
          key={index}
          className={`aspect-square bg-gray-300 rounded-md flex items-center justify-center ${
            state === "matched" ? "border-4 border-green-500" : ""
          } ${state === "hidden" && "cursor-pointer"}`}
          onClick={() => handleCardAction(index)}
        >
          {state === "hidden" ? (
            <span className="text-xl sm:text-2xl font-bold text-gray-600  select-none">
              ?
            </span>
          ) : (
            <img
              src={imageUrl}
              alt={`Card ${value}`}
              className="w-full h-full object-cover rounded-md"
            />
          )}
        </div>
      ))}
    </div>
  );
};

const MatchContent = ({
  cards,
  isItFirstPlayerTurn,
  amIPlayerOne,
  finished,
  setMatched,
  setCards,
  flipSlot,
  resetSlots,
  markSlotsAsMatched,
  setFinished,
  finishMatch,
}: {
  cards: CardDetails[][];
  isItFirstPlayerTurn: boolean;
  amIPlayerOne: boolean;
  finished: boolean;
  setMatched: React.Dispatch<React.SetStateAction<boolean>>;
  setCards: React.Dispatch<React.SetStateAction<CardDetails[][]>>;
  flipSlot: (slotId: number) => Promise<void>;
  resetSlots: (slotIds: number[]) => Promise<void>;
  markSlotsAsMatched: (slotIds: number[]) => Promise<void>;
  setFinished: React.Dispatch<React.SetStateAction<boolean>>;
  finishMatch: () => Promise<void>;
}) => {
  return (
    <div className="mt-6">
      <GridCards
        cards={cards}
        setMatched={setMatched}
        setCards={setCards}
        flipSlot={flipSlot}
        resetSlots={resetSlots}
        markSlotsAsMatched={markSlotsAsMatched}
        isItFirstPlayerTurn={isItFirstPlayerTurn}
        amIPlayerOne={amIPlayerOne}
        finished={finished}
        setFinished={setFinished}
        finishMatch={finishMatch}
      />
    </div>
  );
};

export default function MatchPage() {
  const {
    match,
    getCurrentMatch,
    getAllSlots,
    flipSlot,
    resetSlots,
    markSlotsAsMatched,
    finishMatch,
  } = useMatch();
  const [isItFirstPlayerTurn, setIsItFirstPlayerTurn] =
    useState<boolean>(false);
  const [amIPlayerOne, setAmIPlayerOne] = useState<boolean>(false);
  const [matched, setMatched] = useState<boolean>(false);
  const [finished, setFinished] = useState<boolean>(false);

  const fetchSlots = async () => {
    const slots = (await getAllSlots()) as CardDetails[];
    // Transform slots into 2D array for grid representation
    const grid: CardDetails[][] = [];
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        if (!grid[i]) grid[i] = [];
        const slot = slots.find((s) => s.xPosition === i && s.yPosition === j);
        grid[i][j] = slot!;
      }
    }
    setCards(grid);
  };

  useEffect(() => {
    if (!match) return;

    const checkPlayerTurn = () => {
      fetch("/api/match?action=get-current-player", {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          setIsItFirstPlayerTurn(data.isFirstPlayerTurn);
          setAmIPlayerOne(data.amIPlayerOne);
        });
    };

    const updateMatch = () => {
      if (!match) return;
      console.log(matched, isItFirstPlayerTurn, amIPlayerOne);
      if (
        ((isItFirstPlayerTurn && amIPlayerOne) ||
          (!isItFirstPlayerTurn && !amIPlayerOne)) &&
        !matched
      )
        return;
      getCurrentMatch();
      fetchSlots();
    };

    // Initial check
    checkPlayerTurn();
    updateMatch();

    // Poll every second
    const interval = setInterval(() => {
      checkPlayerTurn();
      updateMatch();
    }, 1000);

    return () => clearInterval(interval);
  }, [match, getCurrentMatch, matched, isItFirstPlayerTurn, amIPlayerOne]);

  const [cards, setCards] = useState<CardDetails[][]>([]);
  const [player1Score, setPlayer1Score] = useState<number>(0); // They are changed in the backend when marking slots as matched
  const [player2Score, setPlayer2Score] = useState<number>(0); // They are changed in the backend when marking slots as matched

  useEffect(() => {
    /* Debugging purpose: remove this block when backend is ready */
    //// Step 1: pick 18 unique numbers from 1–22
    //const allNums = Array.from({ length: 22 }, (_, i) => i + 1);
    //const chosen: number[] = [];
    //const totalPairs = 18;
    //
    //while (chosen.length < totalPairs) {
    //  const idx = Math.floor(Math.random() * allNums.length);
    //  chosen.push(allNums.splice(idx, 1)[0]);
    //}
    //
    //// Step 2: create pairs and shuffle
    //const cardsFlat: CardDetails[] = [];
    //chosen.forEach((v) => {
    //  cardsFlat.push({
    //    value: v,
    //    imageType: "signs",
    //    imageUrl: `/assets/signs/sign-${v}.jpg`,
    //    state: "hidden",
    //    slotId: 0,
    //    xPosition: 0,
    //    yPosition: 0,
    //    description: "",
    //  });
    //  cardsFlat.push({
    //    value: v,
    //    imageType: "figures",
    //    imageUrl: `/assets/figures/figure-${v}.jpg`,
    //    state: "hidden",
    //    slotId: 0,
    //    xPosition: 0,
    //    yPosition: 0,
    //    description: "",
    //  });
    //});
    //
    //// Shuffle
    //for (let i = cardsFlat.length - 1; i > 0; i--) {
    //  const j = Math.floor(Math.random() * (i + 1));
    //  [cardsFlat[i], cardsFlat[j]] = [cardsFlat[j], cardsFlat[i]];
    //}
    //
    //// Step 3: convert to 2D grid (6x6)
    //const debugCards: CardDetails[][] = [];
    //for (let i = 0; i < 6; i++) {
    //  debugCards[i] = [];
    //  for (let j = 0; j < 6; j++) {
    //    debugCards[i][j] = cardsFlat[i * 6 + j];
    //  }
    //}
    //setCards(debugCards);
    ///* End of debugging block */

    // Fetch all slots from the matchId
    if (!match) return;

    fetchSlots();
    setPlayer1Score(match.player1Score);
    setPlayer2Score(match.player2Score);
  }, [match]);

  useEffect(() => {
    async function fetchMatchDetails() {
      await getCurrentMatch();
    }
    fetchMatchDetails();
  }, []);

  const [currentMatch, setCurrentMatch] = useState<MatchFull | null>(null);

  useEffect(() => {
    if (match) {
      setCurrentMatch(match as MatchFull);
    }
  }, [match]);

  if (!currentMatch) {
    return <LoadingScreen />;
  }

  // Debugging purpose: remove this block when backend is ready
  // const [currentMatch, setCurrentMatch] = useState<MatchFull>({
  //   matchId: 0,
  //   state: "playing",
  //   player1Id: 1,
  //   player2Id: 2,
  //   player1username: "Player 1",
  //   player2username: "Player 2",
  //   player1IconNumber: 1,
  //   player2IconNumber: 2,
  //   player1Score: 0,
  //   player2Score: 0,
  //   createdAt: new Date(),
  //   updatedAt: new Date(),
  // });
  // End of debugging block

  return (
    <div className="container mx-auto p-4">
      <HeaderMatch
        currentMatch={currentMatch}
        finished={finished}
        isItFirstPlayerTurn={isItFirstPlayerTurn}
        player1Score={player1Score}
        player2Score={player2Score}
      />
      <MatchContent
        cards={cards}
        isItFirstPlayerTurn={isItFirstPlayerTurn}
        amIPlayerOne={amIPlayerOne}
        setCards={setCards}
        flipSlot={flipSlot}
        resetSlots={resetSlots}
        markSlotsAsMatched={markSlotsAsMatched}
        setMatched={setMatched}
        finished={finished}
        setFinished={setFinished}
        finishMatch={finishMatch}
      />
      {finished && (
        <button
          className="mt-6 px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-lg hover:bg-green-600 transition-colors"
          onClick={() => {
            window.location.href = "/game";
          }}
        >
          Volver
        </button>
      )}
    </div>
  );
}
