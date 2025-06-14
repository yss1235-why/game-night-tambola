
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Game, Winner } from '@/types/game';

interface GameStatusProps {
  game: Game | null;
  winners: Winner[];
}

const GameStatus: React.FC<GameStatusProps> = ({ game, winners }) => {
  if (!game) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No active game found</p>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'waiting': return 'bg-blue-500';
      case 'ended': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPrizeLabel = (prizeType: string) => {
    switch (prizeType) {
      case 'first_line': return 'First Line';
      case 'second_line': return 'Second Line';
      case 'third_line': return 'Third Line';
      case 'full_house': return 'Full House';
      case 'early_five': return 'Early Five';
      case 'corners': return 'Four Corners';
      default: return prizeType;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Game Status</h2>
        <Badge className={getStatusColor(game.status)}>
          {game.status.toUpperCase()}
        </Badge>
      </div>

      {game.status === 'active' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {game.current_number || 'Ready'}
            </div>
            <p className="text-gray-600">Current Number</p>
          </div>
          
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 90 }, (_, i) => i + 1).map(num => (
              <div
                key={num}
                className={`
                  h-8 w-8 border border-gray-300 flex items-center justify-center text-xs
                  ${game.numbers_called.includes(num) ? 'bg-green-500 text-white' : 'bg-gray-100'}
                `}
              >
                {num}
              </div>
            ))}
          </div>
        </div>
      )}

      {winners.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Winners</h3>
          <div className="space-y-2">
            {winners.map(winner => (
              <div key={winner.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                <span className="font-medium">{getPrizeLabel(winner.prize_type)}</span>
                <span>Ticket #{winner.ticket_id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default GameStatus;
