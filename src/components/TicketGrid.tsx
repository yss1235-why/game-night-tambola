
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
    if (!num) return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200';
    
    const isCalled = calledNumbers.includes(num);
    const isWinning = winningNumbers.includes(num);
    const isCurrent = currentNumber === num;
    
    if (isCurrent && isCalled) {
      return 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-black font-bold border-2 border-yellow-600 shadow-lg transform scale-105 animate-pulse';
    }
    if (isWinning && isCalled) {
      return 'bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold border-purple-700 shadow-md';
    }
    if (isCalled) {
      return 'bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold border-green-700 shadow-sm';
    }
    
    return 'bg-gradient-to-br from-white to-gray-50 border-gray-300 hover:shadow-sm transition-shadow';
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
              h-6 w-6 border-2 rounded-md flex items-center justify-center text-xs font-medium transition-all duration-200
              ${getNumberStyle(num)}
            `}
          >
            {showNumbers && num ? (
              <span className="text-center leading-none">{num}</span>
            ) : (
              num && <span className="text-center leading-none">{num}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={`p-6 ${isBooked ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-md' : 'bg-white shadow-sm hover:shadow-md transition-shadow'} rounded-xl border-2`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            #{ticket.ticket_number}
          </div>
          <h3 className="font-bold text-lg text-gray-800">Ticket</h3>
        </div>
        {isBooked && (
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            {booking.player_name}
          </div>
        )}
      </div>
      
      <div className="space-y-2 mb-4">
        {[ticket.row1, ticket.row2, ticket.row3].map((row, index) => 
          renderRow(row, index)
        )}
      </div>

      {/* Enhanced Color Legend */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="text-xs font-medium text-gray-700 mb-2">Legend:</div>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-white to-gray-50 border border-gray-300 rounded"></div>
            <span>Not Called</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-green-600 rounded"></div>
            <span>Called</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded"></div>
            <span>Winning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-yellow-500 border-2 border-yellow-600 rounded"></div>
            <span>Current</span>
          </div>
        </div>
      </div>

      {!isBooked && onWhatsAppBook && (
        <Button 
          onClick={onWhatsAppBook}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          📱 Book via WhatsApp
        </Button>
      )}
    </Card>
  );
};

export default TicketGrid;
