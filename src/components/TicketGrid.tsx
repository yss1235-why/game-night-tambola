
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, Booking } from '@/types/game';

interface TicketGridProps {
  ticket: Ticket;
  booking?: Booking;
  calledNumbers: number[];
  onWhatsAppBook?: () => void;
  showNumbers?: boolean;
}

const TicketGrid: React.FC<TicketGridProps> = ({
  ticket,
  booking,
  calledNumbers,
  onWhatsAppBook,
  showNumbers = false
}) => {
  const isBooked = !!booking;
  
  const renderRow = (numbers: number[], rowIndex: number) => {
    const fullRow = Array(9).fill(null);
    
    // Place numbers in correct columns (0-9: col 0, 10-19: col 1, etc.)
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
              h-8 w-8 border border-gray-300 flex items-center justify-center text-xs
              ${num && calledNumbers.includes(num) ? 'bg-green-500 text-white' : ''}
              ${num ? 'bg-white' : 'bg-gray-100'}
            `}
          >
            {showNumbers && num ? num : ''}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={`p-4 ${isBooked ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg">Ticket #{ticket.ticket_number}</h3>
        {isBooked && (
          <span className="text-sm font-medium text-blue-600">
            Booked by {booking.player_name}
          </span>
        )}
      </div>
      
      <div className="space-y-1 mb-3">
        {[ticket.row1, ticket.row2, ticket.row3].map((row, index) => 
          renderRow(row, index)
        )}
      </div>

      {!isBooked && onWhatsAppBook && (
        <Button 
          onClick={onWhatsAppBook}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          Book via WhatsApp
        </Button>
      )}
    </Card>
  );
};

export default TicketGrid;
