
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Winner } from '@/types/game';

interface WinnerAnnouncementProps {
  newWinners: Winner[];
  onDismiss: (winnerId: string) => void;
}

const WinnerAnnouncement: React.FC<WinnerAnnouncementProps> = ({ newWinners, onDismiss }) => {
  const [visibleWinners, setVisibleWinners] = useState<Winner[]>([]);

  useEffect(() => {
    if (newWinners.length > 0) {
      setVisibleWinners(newWinners);
      
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        newWinners.forEach(winner => onDismiss(winner.id));
        setVisibleWinners([]);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [newWinners, onDismiss]);

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

  if (visibleWinners.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <Card className="p-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-white max-w-md w-full mx-4 animate-scale-in">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 animate-pulse">🎉 WINNER! 🎉</h2>
          
          {visibleWinners.map(winner => (
            <div key={winner.id} className="mb-4 last:mb-0">
              <Badge className="text-lg px-4 py-2 bg-white text-orange-600 font-bold mb-2">
                {getPrizeDisplayName(winner.prize_type)}
              </Badge>
              <div className="text-xl font-semibold">
                Ticket #{winner.ticket_id}
              </div>
            </div>
          ))}
          
          <div className="mt-6">
            <button
              onClick={() => {
                visibleWinners.forEach(winner => onDismiss(winner.id));
                setVisibleWinners([]);
              }}
              className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Continue Game
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WinnerAnnouncement;
