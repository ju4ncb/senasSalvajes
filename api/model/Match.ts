export default interface Match {
  matchId: string;
  state: "waiting" | "playing" | "finished" | "cancelled";
  player1id: string;
  player2id: string;
  player1score: number;
  player2score: number;
  createdAt: Date;
  updatedAt: Date;
}
