import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Game, PrizeType } from '@/types/game';
import { Settings } from 'lucide-react';

interface GameSettingsProps {
  game: Game;
  onGameUpdated: () => void;
}

const GameSettings: React.FC<GameSettingsProps> = ({ game, onGameUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPrizes, setSelectedPrizes] = useState<PrizeType[]>(
    (game.selected_prizes as PrizeType[]) || []
  );

  const availablePrizes: { value: PrizeType; label: string; description: string }[] = [
    { value: 'early_five', label: 'Early Five', description: 'First 5 numbers marked' },
    { value: 'corners', label: 'Four Corners', description: 'All 4 corner numbers marked' },
    { value: 'top_line', label: 'Top Line', description: 'Complete top row' },
    { value: 'middle_line', label: 'Middle Line', description: 'Complete middle row' },
    { value: 'bottom_line', label: 'Bottom Line', description: 'Complete bottom row' },
    { value: 'half_sheet', label: 'Half Sheet', description: 'Any two complete rows' },
    { value: 'full_house', label: 'Full House', description: 'All 15 numbers on ticket' },
    { value: 'full_sheet', label: 'Full Sheet', description: 'Complete ticket with all rows' }
  ];

  const handlePrizeToggle = (prize: PrizeType) => {
    setSelectedPrizes(prev => 
      prev.includes(prize) 
        ? prev.filter(p => p !== prize)
        : [...prev, prize]
    );
  };

  const handleUpdatePrizes = async () => {
    if (selectedPrizes.length === 0) {
      alert('Please select at least one prize type');
      return;
    }

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('games')
        .update({
          selected_prizes: selectedPrizes
        })
        .eq('id', game.id);

      if (error) throw error;

      console.log('Game prizes updated successfully');
      setIsOpen(false);
      onGameUpdated();

    } catch (error) {
      console.error('Error updating game prizes:', error);
      alert('Failed to update prizes. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getSelectedPrizeLabels = () => {
    return selectedPrizes.map(prize => 
      availablePrizes.find(p => p.value === prize)?.label
    ).filter(Boolean).join(', ');
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Game Prizes</h3>
          <p className="text-sm text-gray-600 mt-1">
            {selectedPrizes.length > 0 ? getSelectedPrizeLabels() : 'No prizes selected'}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Edit Prizes
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Update Game Prizes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availablePrizes.map((prize) => (
                  <div key={prize.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`settings-${prize.value}`}
                      checked={selectedPrizes.includes(prize.value)}
                      onCheckedChange={() => handlePrizeToggle(prize.value)}
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor={`settings-${prize.value}`} 
                        className="text-sm font-medium cursor-pointer"
                      >
                        {prize.label}
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">
                        {prize.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedPrizes.length === 0 && (
                <p className="text-sm text-red-500">Please select at least one prize type</p>
              )}
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdatePrizes}
                  disabled={isUpdating || selectedPrizes.length === 0}
                >
                  {isUpdating ? 'Updating...' : 'Update Prizes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
};

export default GameSettings;
