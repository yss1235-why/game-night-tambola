
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Winner, Ticket, Booking } from '@/types/game';

interface WinnersListProps {
  winners: Winner[];
  tickets: Ticket[];
  bookings: Booking[];
}

const WinnersList: React.FC<WinnersListProps> = ({ winners, tickets, bookings }) => {
  const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null);

  const getTicketForWinner = (winner: Winner) => {
    return tickets.find(t => t.id === winner.ticket_id);
  };

  const getBookingForTicket = (ticketId: number) => {
    return bookings.find(b => b.ticket_id === ticketId);
  };

  const renderTicketGrid = (ticket: Ticket) => {
    if (!ticket) return null;

    const renderRow = (numbers: number[], rowIndex: number) => {
      const fullRow = Array(9).fill(null);
      
      numbers.forEach(num => {
        const colIndex = Math.floor(num / 10);
        if (colIndex < 9) {
          fullRow[colIndex] = num;
        }
      });

      return (
        <div key={rowIndex} className="grid grid-cols-9 gap-1">
          {fullRow.map((num, colIndex) => (
            <div
              key={colIndex}
              className={`
                h-10 w-10 border border-gray-300 flex items-center justify-center text-sm font-medium
                ${num ? 'bg-blue-100' : 'bg-gray-50'}
              `}
            >
              {num || ''}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="space-y-2">
        {[ticket.row1, ticket.row2, ticket.row3].map((row, index) => 
          renderRow(row, index)
        )}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Winners</h2>
      <div className="space-y-2">
        {winners.map(winner => {
          const ticket = getTicketForWinner(winner);
          const booking = ticket ? getBookingForTicket(ticket.id) : null;
          
          return (
            <div key={winner.id} className="flex justify-between items-center p-3 bg-green-100 rounded-lg">
              <div>
                <span className="font-medium">
                  {winner.prize_type.replace('_', ' ').toUpperCase()}
                </span>
                <span className="ml-4">Ticket #{ticket?.ticket_number}</span>
                {booking && (
                  <span className="ml-4 text-gray-600">- {booking.player_name}</span>
                )}
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedWinner(winner)}
                  >
                    View Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Winner Ticket #{ticket?.ticket_number} - {winner.prize_type.replace('_', ' ').toUpperCase()}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {booking && (
                      <div className="text-sm text-gray-600">
                        Player: {booking.player_name}
                        {booking.player_phone && ` (${booking.player_phone})`}
                      </div>
                    )}
                    {ticket && renderTicketGrid(ticket)}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default WinnersList;
