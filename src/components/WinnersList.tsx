
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
      // Create a 9-column grid for this row
      const fullRow = Array(9).fill(null);
      
      // Place numbers in correct columns based on their value ranges
      numbers.forEach(num => {
        let colIndex;
        if (num >= 1 && num <= 9) colIndex = 0;
        else if (num >= 10 && num <= 19) colIndex = 1;
        else if (num >= 20 && num <= 29) colIndex = 2;
        else if (num >= 30 && num <= 39) colIndex = 3;
        else if (num >= 40 && num <= 49) colIndex = 4;
        else if (num >= 50 && num <= 59) colIndex = 5;
        else if (num >= 60 && num <= 69) colIndex = 6;
        else if (num >= 70 && num <= 79) colIndex = 7;
        else if (num >= 80 && num <= 90) colIndex = 8;
        
        if (colIndex !== undefined) {
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

  const getPrizeDisplayName = (prizeType: string) => {
    switch (prizeType) {
      case 'top_line': return 'TOP LINE';
      case 'middle_line': return 'MIDDLE LINE';
      case 'bottom_line': return 'BOTTOM LINE';
      case 'full_house': return 'FULL HOUSE';
      case 'early_five': return 'EARLY FIVE';
      case 'corners': return 'FOUR CORNERS';
      case 'half_sheet': return 'HALF SHEET';
      case 'full_sheet': return 'FULL SHEET';
      default: return prizeType.replace('_', ' ').toUpperCase();
    }
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
                  {getPrizeDisplayName(winner.prize_type)}
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
                      Winner Ticket #{ticket?.ticket_number} - {getPrizeDisplayName(winner.prize_type)}
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
