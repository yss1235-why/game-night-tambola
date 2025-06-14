
import React, { useState } from 'react';
import { useGameData } from '@/hooks/useGameData';
import GameStatus from '@/components/GameStatus';
import TicketGrid from '@/components/TicketGrid';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const PlayerView: React.FC = () => {
  const { currentGame, tickets, bookings, winners, lastGameWinners, isLoading } = useGameData();
  const [showTicketNumbers, setShowTicketNumbers] = useState(false);

  const handleWhatsAppBooking = (ticketNumber: number) => {
    const message = `I want to book ticket number ${ticketNumber}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getBookingForTicket = (ticketId: number) => {
    return bookings.find(booking => booking.ticket_id === ticketId);
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <GameStatus game={currentGame} winners={winners} />
        </div>

        <div className="mb-4">
          <Button
            onClick={() => setShowTicketNumbers(!showTicketNumbers)}
            variant="outline"
          >
            {showTicketNumbers ? 'Hide Numbers' : 'Show Numbers'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tickets.map(ticket => (
            <TicketGrid
              key={ticket.id}
              ticket={ticket}
              booking={getBookingForTicket(ticket.id)}
              calledNumbers={currentGame?.numbers_called || []}
              onWhatsAppBook={() => handleWhatsAppBooking(ticket.ticket_number)}
              showNumbers={showTicketNumbers}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerView;
