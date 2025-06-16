
import React, { useState, useEffect } from 'react';
import { useGameData } from '@/hooks/useGameData';
import GameStatus from '@/components/GameStatus';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import WinnersList from '@/components/WinnersList';
import PlayerTicketView from '@/components/PlayerTicketView';
import WinnerAnnouncement from '@/components/WinnerAnnouncement';
import { supabase } from '@/integrations/supabase/client';
import { Winner } from '@/types/game';

const PlayerView: React.FC = () => {
  const { currentGame, tickets, bookings, winners, lastGameWinners, isLoading } = useGameData();
  const [searchTicketNumber, setSearchTicketNumber] = useState('');
  const [viewedTickets, setViewedTickets] = useState<number[]>([]);
  const [newWinners, setNewWinners] = useState<Winner[]>([]);
  const [dismissedWinners, setDismissedWinners] = useState<Set<string>>(new Set());

  // Real-time winner detection
  useEffect(() => {
    if (!currentGame || currentGame.status !== 'active') return;

    const channel = supabase
      .channel('winners-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'winners',
        filter: `game_id=eq.${currentGame.id}`
      }, (payload) => {
        const newWinner = payload.new as Winner;
        if (!dismissedWinners.has(newWinner.id)) {
          setNewWinners(prev => [...prev, newWinner]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentGame, dismissedWinners]);

  const handleSearchTicket = () => {
    const ticketNumber = parseInt(searchTicketNumber);
    if (!ticketNumber) return;

    // Find the player who booked this ticket
    const booking = bookings.find(b => {
      const ticket = tickets.find(t => t.id === b.ticket_id);
      return ticket?.ticket_number === ticketNumber;
    });

    if (booking) {
      // Find all tickets booked by this player
      const playerBookings = bookings.filter(b => b.player_name === booking.player_name);
      const playerTicketNumbers = playerBookings.map(b => {
        const ticket = tickets.find(t => t.id === b.ticket_id);
        return ticket?.ticket_number;
      }).filter(Boolean) as number[];

      // Add all player's tickets to viewed tickets (avoid duplicates)
      setViewedTickets(prev => {
        const newTickets = playerTicketNumbers.filter(num => !prev.includes(num));
        return [...prev, ...newTickets];
      });
    } else {
      // If ticket not found or not booked, just add the searched ticket
      if (!viewedTickets.includes(ticketNumber)) {
        setViewedTickets(prev => [...prev, ticketNumber]);
      }
    }
    
    setSearchTicketNumber('');
  };

  const removeTicketFromView = (ticketNumber: number) => {
    setViewedTickets(prev => prev.filter(num => num !== ticketNumber));
  };

  const handleDismissWinner = (winnerId: string) => {
    setDismissedWinners(prev => new Set([...prev, winnerId]));
    setNewWinners(prev => prev.filter(w => w.id !== winnerId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

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
                      <span>#{winner.ticket_id}</span>
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
              Search Player's Tickets
            </Button>
          </div>
          
          {viewedTickets.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Viewing Tickets:</h3>
              <div className="flex flex-wrap gap-2">
                {viewedTickets.map(ticketNumber => {
                  const booking = bookings.find(b => {
                    const ticket = tickets.find(t => t.id === b.ticket_id);
                    return ticket?.ticket_number === ticketNumber;
                  });
                  
                  return (
                    <div key={ticketNumber} className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded">
                      <span>#{ticketNumber}</span>
                      {booking && (
                        <span className="text-xs text-blue-600">({booking.player_name})</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTicketFromView(ticketNumber)}
                        className="h-auto p-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </Button>
                    </div>
                  );
                })}
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
            currentNumber={currentGame?.current_number}
            onRemoveTicket={removeTicketFromView}
          />
        )}

        {/* Winners List */}
        {winners.length > 0 && (
          <WinnersList 
            winners={winners}
            tickets={tickets}
            bookings={bookings}
            calledNumbers={currentGame?.numbers_called || []}
            currentNumber={currentGame?.current_number}
          />
        )}

        {/* Real-time Winner Announcements */}
        <WinnerAnnouncement 
          newWinners={newWinners} 
          onDismiss={handleDismissWinner} 
        />
      </div>
    </div>
  );
};

export default PlayerView;
