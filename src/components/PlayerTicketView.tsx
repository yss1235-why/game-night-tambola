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
    if (!num) return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200';
    
    const isCalled = calledNumbers.includes(num);
    const isCurrent = currentNumber === num;
    
    if (isCurrent && isCalled) {
      return 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-black font-bold border-2 border-yellow-600 shadow-lg transform scale-105 animate-pulse';
    }
    if (isCalled) {
      return 'bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold border-green-700 shadow-sm';
    }
    
    return 'bg-gradient-to-br from-white to-gray-50 border-gray-300 hover:shadow-sm transition-shadow';
  };

  const handleWhatsAppRedirect = (ticketNumber: number) => {
    const hostPhone = "1234567890"; // You can make this dynamic from game data
    const message = `Hi! I would like to book ticket #${ticketNumber} for the Tambola game.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${hostPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
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
                h-6 w-6 border-2 rounded-md flex items-center justify-center text-xs font-medium transition-all duration-200
                ${getNumberStyle(num)}
              `}
            >
              {num && <span className="text-center leading-none">{num}</span>}
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
        
        {ticketBookings.length === 0 && (
          <Button 
            onClick={() => handleWhatsAppRedirect(ticket.ticket_number)}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            📱 Book This
          </Button>
        )}
      </div>
    );
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-white to-gray-50 shadow-lg rounded-xl border-2">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        🎫 Your Tickets
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {viewedTickets.map(ticketNumber => {
          const ticket = getTicketByNumber(ticketNumber);
          const ticketBookings = ticket ? getBookingsForTicket(ticket.id) : [];
          
          return (
            <Card key={ticketNumber} className="p-5 relative bg-white shadow-md hover:shadow-lg transition-shadow rounded-xl border-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveTicket(ticketNumber)}
                className="absolute top-2 right-2 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
              >
                <X size={16} />
              </Button>
              
              {/* Top corner booking info */}
              {ticketBookings.length > 0 && (
                <div className="absolute top-4 right-12 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {ticketBookings[0].player_name}
                </div>
              )}
              
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    #{ticketNumber}
                  </div>
                </div>
                {!ticket && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                    <p className="text-sm text-red-600 font-medium">Ticket not found</p>
                  </div>
                )}
              </div>
              
              {ticket ? (
                renderTicketGrid(ticket, ticketBookings)
              ) : (
                <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg">
                  <div className="text-4xl mb-2">🎫</div>
                  <p className="font-medium">Ticket #{ticketNumber} not available</p>
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
