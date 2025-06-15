import React, { useState } from 'react';
import { useGameData } from '@/hooks/useGameData';
import GameStatus from '@/components/GameStatus';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import NumberGrid from '@/components/NumberGrid';
import WinnersList from '@/components/WinnersList';
import PlayerTicketView from '@/components/PlayerTicketView';
import WinnerAnnouncement from '@/components/WinnerAnnouncement';

const PlayerView: React.FC = () => {
  const { currentGame, tickets, bookings, winners, lastGameWinners, isLoading } = useGameData();
  const [searchTicketNumber, setSearchTicketNumber] = useState('');
  const [viewedTickets, setViewedTickets] = useState<number[]>([]);
  const [announcedWinners, setAnnouncedWinners] = useState<Set<string>>(new Set());

  // Debug log for real-time updates
  React.useEffect(() => {
    console.log('PlayerView - Game updated:', currentGame?.status, currentGame?.id);
  }, [currentGame]);

  const handleSearchTicket = () => {
    const ticketNumber = parseInt(searchTicketNumber);
    if (ticketNumber && !viewedTickets.includes(ticketNumber)) {
      setViewedTickets(prev => [...prev, ticketNumber]);
    }
    setSearchTicketNumber('');
  };

  const removeTicketFromView = (ticketNumber: number) => {
    setViewedTickets(prev => prev.filter(num => num !== ticketNumber));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Get new winners that haven't been announced yet
  const newWinners = winners.filter(winner => !announcedWinners.has(winner.id));

  const handleDismissWinner = (winnerId: string) => {
    setAnnouncedWinners(prev => new Set([...prev, winnerId]));
  };

  // Show last game winners if no active game
  if (!currentGame || currentGame.status === 'ended') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <Card className="p-6 text-center mb-6">
            <h1 className="text-3xl font-bold mb-4">Game Ended</h1>
            {lastGameWinners.length > 0 ? (
              <div>
                <h2 className="text-xl font-semibold mb-4">Last Game Winners</h2>
                <div className="space-y-2">
                  {lastGameWinners.map(winner => (
                    <div key={winner.id} className="p-3 bg-yellow-100 rounded-lg">
                      <span className="font-medium">{winner.prize_type.replace('_', ' ').toUpperCase()}</span>
                      {' - '}
                      <span>Ticket #{winner.ticket_id}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Waiting for next game...</p>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-6">
          <GameStatus game={currentGame} winners={winners} />
        </div>

        {/* Single Number Grid - only show during active or paused game */}
        {(currentGame.status === 'active' || currentGame.status === 'paused') && (
          <NumberGrid 
            calledNumbers={currentGame?.numbers_called || []}
            currentNumber={currentGame?.current_number}
          />
        )}

        {/* Ticket Search */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Search Your Tickets</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="ticketSearch">Enter Ticket Number</Label>
              <Input
                id="ticketSearch"
                type="number"
                value={searchTicketNumber}
                onChange={(e) => setSearchTicketNumber(e.target.value)}
                placeholder="Enter ticket number..."
                className="mt-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSearchTicket()}
              />
            </div>
            <Button onClick={handleSearchTicket} disabled={!searchTicketNumber}>
              Search Ticket
            </Button>
          </div>
          
          {viewedTickets.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Searched Tickets:</h3>
              <div className="flex flex-wrap gap-2">
                {viewedTickets.map(ticketNumber => (
                  <div key={ticketNumber} className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded">
                    <span>#{ticketNumber}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTicketFromView(ticketNumber)}
                      className="h-auto p-1 text-red-500 hover:text-red-700"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Player Tickets View */}
        {viewedTickets.length > 0 && (
          <PlayerTicketView
            viewedTickets={viewedTickets}
            tickets={tickets}
            bookings={bookings}
            calledNumbers={currentGame?.numbers_called || []}
            onRemoveTicket={removeTicketFromView}
          />
        )}

        {/* Winners List */}
        {winners.length > 0 && (
          <WinnersList 
            winners={winners}
            tickets={tickets}
            bookings={bookings}
          />
        )}

        {/* Winner Announcement Overlay */}
        {newWinners.length > 0 && (
          <WinnerAnnouncement
            newWinners={newWinners}
            onDismiss={handleDismissWinner}
          />
        )}
      </div>
    </div>
  );
};

export default PlayerView;
