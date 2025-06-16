
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Winner, Ticket, Booking } from '@/types/game';
import TicketGrid from '@/components/TicketGrid';

interface WinnerItemProps {
  winner: Winner;
  tickets: Ticket[];
  bookings: Booking[];
  calledNumbers: number[];
  currentNumber?: number | null;
}

const WinnerItem: React.FC<WinnerItemProps> = ({
  winner,
  tickets,
  bookings,
  calledNumbers,
  currentNumber
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getWinnerTickets = () => {
    if (winner.prize_type === 'half_sheet' || winner.prize_type === 'full_sheet') {
      // For sheet prizes, find all tickets belonging to the same player
      const winnerTicket = tickets.find(t => t.id === winner.ticket_id);
      if (!winnerTicket) return [];

      const winnerBooking = bookings.find(b => b.ticket_id === winner.ticket_id);
      if (!winnerBooking) return [winnerTicket];

      // Find all tickets for this player
      const playerBookings = bookings.filter(b => b.player_name === winnerBooking.player_name);
      const playerTickets = playerBookings.map(b => 
        tickets.find(t => t.id === b.ticket_id)
      ).filter(Boolean) as Ticket[];

      // Sort by ticket number
      return playerTickets.sort((a, b) => a.ticket_number - b.ticket_number);
    } else {
      // For regular prizes, just return the winning ticket
      const winnerTicket = tickets.find(t => t.id === winner.ticket_id);
      return winnerTicket ? [winnerTicket] : [];
    }
  };

  const getWinningNumbers = (ticket: Ticket, prizeType: string): number[] => {
    switch (prizeType) {
      case 'quick_five':
        // First 5 numbers that were called from this ticket
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
      case 'half_sheet':
      case 'full_sheet':
        return ticket.numbers;
      default:
        return [];
    }
  };

  const winnerTickets = getWinnerTickets();
  const mainTicket = winnerTickets[0];
  
  if (!mainTicket) return null;

  const winnerBooking = bookings.find(b => b.ticket_id === mainTicket.id);
  const playerName = winnerBooking?.player_name || 'Unknown Player';

  const getDisplayText = () => {
    if (winner.prize_type === 'half_sheet') {
      return `${playerName} - Half Sheet (${winnerTickets.length} tickets)`;
    } else if (winner.prize_type === 'full_sheet') {
      return `${playerName} - Full Sheet (${winnerTickets.length} tickets)`;
    } else {
      return `${playerName} - Ticket #${mainTicket.ticket_number}`;
    }
  };

  return (
    <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full p-4 h-auto justify-between hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full font-bold text-sm">
                {winner.prize_type.replace('_', ' ').toUpperCase()}
              </div>
              <span className="text-lg font-semibold text-gray-700">
                {getDisplayText()}
              </span>
              <div className="text-sm text-gray-500">
                Won at {new Date(winner.claimed_at || '').toLocaleTimeString()}
              </div>
            </div>
            {isOpen ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-4 pt-2">
            {winnerTickets.map((ticket) => {
              const ticketBooking = bookings.find(b => b.ticket_id === ticket.id);
              const winningNumbers = getWinningNumbers(ticket, winner.prize_type);
              
              return (
                <div key={ticket.id} className="bg-white p-4 rounded-lg shadow-sm border">
                  <div className="mb-3 flex justify-between items-center">
                    <h4 className="font-semibold text-gray-700">
                      Ticket #{ticket.ticket_number}
                    </h4>
                    {ticketBooking && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {ticketBooking.player_name}
                      </span>
                    )}
                  </div>
                  
                  <TicketGrid
                    ticket={ticket}
                    booking={ticketBooking}
                    calledNumbers={calledNumbers}
                    currentNumber={currentNumber}
                    winningNumbers={winningNumbers}
                    showNumbers={true}
                  />
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default WinnerItem;
