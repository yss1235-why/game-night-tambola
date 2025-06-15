
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, Booking } from '@/types/game';

interface TicketGridProps {
  ticket: Ticket;
  booking?: Booking;
  calledNumbers: number[];
  currentNumber?: number | null;
  winningNumbers?: number[];
  onWhatsAppBook?: () => void;
  showNumbers?: boolean;
}

const TicketGrid: React.FC<TicketGridProps> = ({
  ticket,
  booking,
  calledNumbers,
  currentNumber,
  winningNumbers = [],
  onWhatsAppBook,
  showNumbers = false
}) => {
  const isBooked = !!booking;
  
  const getNumberStyle = (num: number | null) => {
    if (!num) return 'bg-gray-100';
    
    const isCalled = calledNumbers.includes(num);
    const isWinning = winningNumbers.includes(num);
    const isCurrent = currentNumber === num;
    
    if (isCurrent && isCalled) {
      return 'bg-yellow-400 text-black font-bold border-2 border-yellow-600';
    }
    if (isWinning && isCalled) {
      return 'bg-purple-500 text-white font-bold';
    }
    if (isCalled) {
      return 'bg-green-500 text-white font-semibold';
    }
    
    return 'bg-white';
  };
  
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
              h-8 w-8 border border-gray-300 flex items-center justify-center text-xs font-medium transition-colors
              ${getNumberStyle(num)}
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

      {/* Color Legend */}
      <div className="text-xs text-gray-600 space-y-1 mb-3">
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
            <div className="w-3 h-3 bg-purple-500"></div>
            <span>Winning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-400 border-2 border-yellow-600"></div>
            <span>Current</span>
          </div>
        </div>
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
