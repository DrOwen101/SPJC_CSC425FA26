'use client';

import { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

export default function ChessGame() {
  const [game, setGame] = useState(() => new Chess());

  function onDrop({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) {
    if (!targetSquare) return false;

    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // Always promote to a queen for simplicity
      });

      if (move === null) return false;

      setGame(gameCopy);
      return true;
    } catch {
      return false;
    }
  }

  function resetGame() {
    setGame(new Chess());
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="w-full max-w-[480px]">
        <Chessboard
          options={{
            position: game.fen(),
            onPieceDrop: onDrop,
            boardOrientation: 'white',
          }}
        />
      </div>

      <div className="flex items-center gap-4">
        <p className="font-semibold">
          {game.isCheckmate()
            ? 'Checkmate!'
            : game.isDraw()
            ? 'Draw!'
            : `Turn: ${game.turn() === 'w' ? 'White' : 'Black'}`}
        </p>
        <button
          onClick={resetGame}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Reset Board
        </button>
      </div>
    </div>
  );
}
