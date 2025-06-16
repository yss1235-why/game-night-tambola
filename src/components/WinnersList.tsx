
import React from 'react';
import { Card } from '@/components/ui/card';
import { Winner, Ticket, Booking } from '@/types/game';
import WinnerItem from '@/components/WinnerItem';

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
  if (winners.length === 0) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg rounded-xl border-2">
      <h2 className="text-2xl font-bold mb-6 text-green-800 flex items-center gap-2">
        🏆 Winners!
      </h2>
      <div className="space-y-3">
        {winners.map(winner => (
          <WinnerItem
            key={winner.id}
            winner={winner}
            tickets={tickets}
            bookings={bookings}
            calledNumbers={calledNumbers}
            currentNumber={currentNumber}
          />
        ))}
      </div>
    </Card>
  );
};

export default WinnersList;
