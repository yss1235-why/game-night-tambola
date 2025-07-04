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

  const handleWhatsAppRedirect = () => {
    const hostPhone = "1234567890"; // You can make this dynamic from game data
    const message = `Hi! I would like to book ticket #${ticket.ticket_number} for the Tambola game.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${hostPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Card className={`p-6 ${isBooked ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-md' : 'bg-white shadow-sm hover:shadow-md transition-shadow'} rounded-xl border-2 relative`}>
      {/* Top corner booking info */}
      {isBooked && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          {booking.player_name}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            #{ticket.ticket_number}
          </div>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        {[ticket.row1, ticket.row2, ticket.row3].map((row, index) => 
          renderRow(row, index)
        )}
      </div>

      {!isBooked && (
        <Button 
          onClick={handleWhatsAppRedirect}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          📱 Book This
        </Button>
      )}
    </Card>
  );
};

export default TicketGrid;
