
import React from 'react';
import { Card } from '@/components/ui/card';
import { Winner, Ticket, Booking } from '@/types/game';
import TicketGrid from '@/components/TicketGrid';

interface WinnersListProps {
  winners: Winner[];
  tickets: Ticket[];
  bookings: Booking[];
  calledNumbers: number[];
  currentNumber?: number | null;
}

const WinnersList: React.FC<WinnersListProps> = ({
  winners,
  tickets,
  bookings,
  calledNumbers,
  currentNumber
}) => {
  if (winners.length === 0) return null;

  const getTicketById = (ticketId: number) => {
    return tickets.find(t => t.id === ticketId);
  };

  const getBookingForTicket = (ticketId: number) => {
    return bookings.find(b => b.ticket_id === ticketId);
  };

  const getWinningNumbers = (winner: Winner) => {
    // This would contain the logic to determine which numbers created the winning pattern
    // For now, returning empty array - this would be implemented based on the prize type
    return [];
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg rounded-xl border-2">
      <h2 className="text-2xl font-bold mb-6 text-green-800 flex items-center gap-2">
        🏆 Winners!
      </h2>
      <div className="space-y-6">
        {winners.map(winner => {
          const ticket = getTicketById(winner.ticket_id);
          const booking = getBookingForTicket(winner.ticket_id);
          const winningNumbers = getWinningNumbers(winner);
          
          if (!ticket) return null;
          
          return (
            <div key={winner.id} className="bg-white p-4 rounded-lg border-2 border-green-300 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full font-bold">
                    {winner.prize_type.replace('_', ' ').toUpperCase()}
                  </div>
                  <span className="text-lg font-semibold text-gray-700">
                    Ticket #{ticket.ticket_number}
                  </span>
                  {booking && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {booking.player_name}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Won at {new Date(winner.created_at).toLocaleTimeString()}
                </div>
              </div>
              
              <TicketGrid
                ticket={ticket}
                booking={booking}
                calledNumbers={calledNumbers}
                currentNumber={currentNumber}
                winningNumbers={winningNumbers}
                showNumbers={true}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default WinnersList;
