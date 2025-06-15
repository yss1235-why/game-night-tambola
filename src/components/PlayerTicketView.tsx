
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, Booking } from '@/types/game';
import { X } from 'lucide-react';

interface PlayerTicketViewProps {
  viewedTickets: number[];
  tickets: Ticket[];
  bookings: Booking[];
  calledNumbers: number[];
  currentNumber?: number | null;
  onRemoveTicket: (ticketNumber: number) => void;
}

const PlayerTicketView: React.FC<PlayerTicketViewProps> = ({
  viewedTickets,
  tickets,
  bookings,
  calledNumbers,
  currentNumber,
  onRemoveTicket
}) => {
  const getTicketByNumber = (ticketNumber: number) => {
    return tickets.find(t => t.ticket_number === ticketNumber);
  };

  const getBookingsForTicket = (ticketId: number) => {
    return bookings.filter(b => b.ticket_id === ticketId);
  };

  const getNumberStyle = (num: number | null) => {
    if (!num) return 'bg-gray-100';
    
    const isCalled = calledNumbers.includes(num);
    const isCurrent = currentNumber === num;
    
    if (isCurrent && isCalled) {
      return 'bg-yellow-400 text-black font-bold border-2 border-yellow-600';
    }
    if (isCalled) {
      return 'bg-green-500 text-white font-semibold';
    }
    
    return 'bg-white';
  };

  const renderTicketGrid = (ticket: Ticket, ticketBookings: Booking[]) => {
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
                h-10 w-10 border border-gray-300 flex items-center justify-center text-sm font-medium transition-colors
                ${getNumberStyle(num)}
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
        <div className="space-y-1">
          {[ticket.row1, ticket.row2, ticket.row3].map((row, index) => 
            renderRow(row, index)
          )}
        </div>
        
        {/* Color Legend */}
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-white border border-gray-300"></div>
              <span>Not Called</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500"></div>
              <span>Called</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400 border-2 border-yellow-600"></div>
              <span>Current</span>
            </div>
          </div>
        </div>
        
        {ticketBookings.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            <strong>Booked by:</strong>
            {ticketBookings.map((booking, index) => (
              <div key={booking.id}>
                {booking.player_name}
                {booking.player_phone && ` (${booking.player_phone})`}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Your Tickets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {viewedTickets.map(ticketNumber => {
          const ticket = getTicketByNumber(ticketNumber);
          const ticketBookings = ticket ? getBookingsForTicket(ticket.id) : [];
          
          return (
            <Card key={ticketNumber} className="p-4 relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveTicket(ticketNumber)}
                className="absolute top-2 right-2 h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </Button>
              
              <div className="mb-3">
                <h3 className="font-bold text-lg">Ticket #{ticketNumber}</h3>
                {!ticket && (
                  <p className="text-sm text-red-500">Ticket not found</p>
                )}
                {ticket && ticketBookings.length === 0 && (
                  <p className="text-sm text-orange-500">Not booked</p>
                )}
              </div>
              
              {ticket ? (
                renderTicketGrid(ticket, ticketBookings)
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>Ticket #{ticketNumber} not available</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Card>
  );
};

export default PlayerTicketView;
