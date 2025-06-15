import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Winner, Ticket, Booking } from '@/types/game';

interface WinnersListProps {
  winners: Winner[];
  tickets: Ticket[];
  bookings: Booking[];
  calledNumbers?: number[];
  currentNumber?: number | null;
}

const WinnersList: React.FC<WinnersListProps> = ({ 
  winners, 
  tickets, 
  bookings, 
  calledNumbers = [],
  currentNumber 
}) => {
  const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null);

  const getTicketForWinner = (winner: Winner) => {
    return tickets.find(t => t.id === winner.ticket_id);
  };

  const getBookingForTicket = (ticketId: number) => {
    return bookings.find(b => b.ticket_id === ticketId);
  };

  const getWinningNumbers = (ticket: Ticket, prizeType: string) => {
    if (!ticket) return [];
    
    switch (prizeType) {
      case 'quick_five':
        // Return first 5 called numbers that are on the ticket
        return ticket.numbers.filter(num => calledNumbers.includes(num)).slice(0, 5);
      case 'corners':
        return [ticket.row1[0], ticket.row1[4], ticket.row3[0], ticket.row3[4]];
      case 'star_corners':
        return [ticket.row1[0], ticket.row1[4], ticket.row2[2], ticket.row3[0], ticket.row3[4]];
      case 'top_line':
        return ticket.row1;
      case 'middle_line':
        return ticket.row2;
      case 'bottom_line':
        return ticket.row3;
      case 'full_house':
      case 'second_full_house':
        return ticket.numbers;
      case 'half_sheet':
      case 'full_sheet':
        // For sheets, highlight all numbers on the winning ticket
        return ticket.numbers;
      default:
        return [];
    }
  };

  const getNumberStyle = (num: number | null, winningNumbers: number[]) => {
    if (!num) return 'bg-gray-50';
    
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
    
    return 'bg-blue-100';
  };

  const renderTicketGrid = (ticket: Ticket, prizeType: string) => {
    if (!ticket) return null;

    const winningNumbers = getWinningNumbers(ticket, prizeType);

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
                ${getNumberStyle(num, winningNumbers)}
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
        
        {/* Color Legend */}
        <div className="text-xs text-gray-600 mt-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-100 border border-gray-300"></div>
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
      </div>
    );
  };

  const getPrizeDisplayName = (prizeType: string) => {
    switch (prizeType) {
      case 'quick_five': return 'QUICK 5';
      case 'corners': return 'CORNERS';
      case 'star_corners': return 'STAR CORNERS';
      case 'top_line': return 'TOP LINE';
      case 'middle_line': return 'MIDDLE LINE';
      case 'bottom_line': return 'BOTTOM LINE';
      case 'half_sheet': return 'HALF SHEET';
      case 'full_sheet': return 'FULL SHEET';
      case 'full_house': return 'FULL HOUSE';
      case 'second_full_house': return '2ND FULL HOUSE';
      default: return prizeType.replace('_', ' ').toUpperCase();
    }
  };

  const renderSheetTickets = (winner: Winner) => {
    if (winner.prize_type !== 'half_sheet' && winner.prize_type !== 'full_sheet') {
      return null;
    }

    const winnerTicket = tickets.find(t => t.id === winner.ticket_id);
    if (!winnerTicket) return null;

    const maxTickets = 1000; // Default max, could be passed as prop
    const isHalfSheet = winner.prize_type === 'half_sheet';
    
    let sheetTickets: number[] = [];
    
    if (isHalfSheet) {
      // Find the half sheet this ticket belongs to
      const ticketNumber = winnerTicket.ticket_number;
      const endTicket = Math.ceil(ticketNumber / 3) * 3;
      sheetTickets = [endTicket - 2, endTicket - 1, endTicket];
    } else {
      // Find the full sheet this ticket belongs to
      const ticketNumber = winnerTicket.ticket_number;
      const endTicket = Math.ceil(ticketNumber / 6) * 6;
      sheetTickets = [endTicket - 5, endTicket - 4, endTicket - 3, endTicket - 2, endTicket - 1, endTicket];
    }

    return (
      <div className="mt-2">
        <div className="text-sm text-gray-600 mb-2">
          Sheet tickets: {sheetTickets.join(', ')}
        </div>
        <div className="grid grid-cols-3 gap-1">
          {sheetTickets.map(ticketNum => {
            const ticket = tickets.find(t => t.ticket_number === ticketNum);
            const booking = ticket ? bookings.find(b => b.ticket_id === ticket.id) : null;
            
            return (
              <div key={ticketNum} className="text-xs p-1 bg-gray-100 rounded text-center">
                #{ticketNum}
                {booking && <div className="text-blue-600">{booking.player_name}</div>}
              </div>
            );
          })}
        </div>
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
            <div key={winner.id} className="p-3 bg-green-100 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="font-medium">
                      {getPrizeDisplayName(winner.prize_type)}
                    </span>
                    <span>Ticket #{ticket?.ticket_number}</span>
                    {booking && (
                      <span className="text-gray-600">- {booking.player_name}</span>
                    )}
                  </div>
                  {renderSheetTickets(winner)}
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedWinner(winner)}
                    >
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        Winner Details - {getPrizeDisplayName(winner.prize_type)}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {booking && (
                        <div className="text-sm text-gray-600">
                          Player: {booking.player_name}
                          {booking.player_phone && ` (${booking.player_phone})`}
                        </div>
                      )}
                      
                      {(winner.prize_type === 'half_sheet' || winner.prize_type === 'full_sheet') && (
                        <div>
                          <h4 className="font-medium mb-2">Sheet Information:</h4>
                          {renderSheetTickets(winner)}
                        </div>
                      )}
                      
                      {ticket && (
                        <div>
                          <h4 className="font-medium mb-2">Winning Ticket #{ticket.ticket_number}:</h4>
                          {renderTicketGrid(ticket, winner.prize_type)}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default WinnersList;
