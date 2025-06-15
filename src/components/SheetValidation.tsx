
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Booking, Ticket } from '@/types/game';
import { findHalfSheetCandidates, findFullSheetCandidates, validateSheetForWinning, SheetCandidate } from '@/utils/sheetValidation';

interface SheetValidationProps {
  bookings: Booking[];
  tickets: Ticket[];
  calledNumbers: number[];
  maxTickets: number;
}

const SheetValidation: React.FC<SheetValidationProps> = ({
  bookings,
  tickets,
  calledNumbers,
  maxTickets
}) => {
  const halfSheetCandidates = findHalfSheetCandidates(bookings, tickets, maxTickets);
  const fullSheetCandidates = findFullSheetCandidates(bookings, tickets, maxTickets);

  const renderSheetCandidate = (candidate: SheetCandidate, type: 'half' | 'full') => {
    const validation = validateSheetForWinning(candidate, tickets, calledNumbers);
    
    return (
      <div key={`${type}-${candidate.tickets.join('-')}`} className="p-3 border rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">
            Tickets: {candidate.tickets.join(', ')}
          </span>
          <Badge variant={validation.isWinner ? 'default' : candidate.isValid ? 'secondary' : 'destructive'}>
            {validation.isWinner ? 'WINNER' : candidate.isValid ? 'Valid Sheet' : 'Invalid'}
          </Badge>
        </div>
        
        <div className="text-sm text-gray-600">
          <div>Player: {candidate.playerName}</div>
          {!validation.isWinner && validation.reason && (
            <div className="text-red-600 mt-1">Reason: {validation.reason}</div>
          )}
          {!candidate.isValid && candidate.reason && (
            <div className="text-red-600 mt-1">Issue: {candidate.reason}</div>
          )}
        </div>

        {candidate.isValid && (
          <div className="mt-2 text-xs">
            <div className="grid grid-cols-3 gap-1">
              {candidate.tickets.map(ticketNum => {
                const ticket = tickets.find(t => t.ticket_number === ticketNum);
                if (!ticket) return null;
                
                const markedCount = ticket.numbers.filter(num => calledNumbers.includes(num)).length;
                return (
                  <div key={ticketNum} className={`p-1 text-center border rounded ${markedCount >= 2 ? 'bg-green-100' : 'bg-red-100'}`}>
                    #{ticketNum} ({markedCount})
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Half Sheet Validation</h3>
        <div className="space-y-2">
          {halfSheetCandidates.length > 0 ? (
            halfSheetCandidates.map(candidate => renderSheetCandidate(candidate, 'half'))
          ) : (
            <p className="text-gray-500">No half sheet candidates found</p>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Full Sheet Validation</h3>
        <div className="space-y-2">
          {fullSheetCandidates.length > 0 ? (
            fullSheetCandidates.map(candidate => renderSheetCandidate(candidate, 'full'))
          ) : (
            <p className="text-gray-500">No full sheet candidates found</p>
          )}
        </div>
      </Card>

      <Card className="p-4 bg-blue-50">
        <h4 className="font-medium mb-2">Sheet Rules:</h4>
        <div className="text-sm space-y-1">
          <div><strong>Half Sheet:</strong> 3 consecutive tickets ending on multiples of 3 (e.g., 10,11,12)</div>
          <div><strong>Full Sheet:</strong> 6 consecutive tickets ending on multiples of 6 (e.g., 19,20,21,22,23,24)</div>
          <div><strong>Requirements:</strong> Same player ownership + minimum 2 marked numbers per ticket</div>
        </div>
      </Card>
    </div>
  );
};

export default SheetValidation;
