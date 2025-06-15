
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { PrizeType } from '@/types/game';

interface GameSetupProps {
  onGameCreated: () => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ onGameCreated }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [hostPhone, setHostPhone] = useState('');
  const [ticketSet, setTicketSet] = useState('');
  const [maxTickets, setMaxTickets] = useState(100);
  const [selectedPrizes, setSelectedPrizes] = useState<PrizeType[]>([]);

  const availablePrizes: { value: PrizeType; label: string; description: string }[] = [
    { value: 'quick_five', label: 'Quick 5', description: 'First 5 numbers marked' },
    { value: 'corners', label: 'Corners', description: 'All 4 corner numbers marked' },
    { value: 'star_corners', label: 'Star Corners', description: 'All corner numbers plus center marked' },
    { value: 'top_line', label: 'Top Line', description: 'Complete top row' },
    { value: 'middle_line', label: 'Middle Line', description: 'Complete middle row' },
    { value: 'bottom_line', label: 'Bottom Line', description: 'Complete bottom row' },
    { value: 'half_sheet', label: 'Half Sheet', description: 'Any two complete rows' },
    { value: 'full_sheet', label: 'Full Sheet', description: 'Complete ticket with all rows' },
    { value: 'full_house', label: 'Full House', description: 'All 15 numbers on ticket' },
    { value: 'second_full_house', label: '2nd Full House', description: 'Second ticket to complete all 15 numbers' }
  ];

  const handlePrizeToggle = (prize: PrizeType) => {
    setSelectedPrizes(prev => 
      prev.includes(prize) 
        ? prev.filter(p => p !== prize)
        : [...prev, prize]
    );
  };

  const handleCreateGame = async () => {
    if (selectedPrizes.length === 0) {
      alert('Please select at least one prize type');
      return;
    }

    setIsCreating(true);

    try {
      // Create a new game
      const { data, error } = await supabase
        .from('games')
        .insert({
          host_id: 'demo-host-id', // Replace with actual host ID from authentication
          status: 'waiting',
          host_phone: hostPhone || null,
          ticket_set: ticketSet || null,
          max_tickets: maxTickets,
          selected_prizes: selectedPrizes
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Game created successfully:', data);
      onGameCreated();

    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Setup New Game</h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hostPhone">Host Phone (Optional)</Label>
            <Input
              id="hostPhone"
              type="tel"
              value={hostPhone}
              onChange={(e) => setHostPhone(e.target.value)}
              placeholder="+1234567890"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="ticketSet">Ticket Set Name (Optional)</Label>
            <Input
              id="ticketSet"
              value={ticketSet}
              onChange={(e) => setTicketSet(e.target.value)}
              placeholder="e.g., Evening Game, Special Event"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="maxTickets">Maximum Tickets</Label>
          <Select value={maxTickets.toString()} onValueChange={(value) => setMaxTickets(parseInt(value))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50 tickets</SelectItem>
              <SelectItem value="100">100 tickets</SelectItem>
              <SelectItem value="200">200 tickets</SelectItem>
              <SelectItem value="500">500 tickets</SelectItem>
              <SelectItem value="1000">1000 tickets</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-base font-medium mb-3 block">Select Prize Types</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availablePrizes.map((prize) => (
              <div key={prize.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={prize.value}
                  checked={selectedPrizes.includes(prize.value)}
                  onCheckedChange={() => handlePrizeToggle(prize.value)}
                />
                <div className="flex-1">
                  <Label 
                    htmlFor={prize.value} 
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
            <p className="text-sm text-red-500 mt-2">Please select at least one prize type</p>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Button
            onClick={handleCreateGame}
            disabled={isCreating || selectedPrizes.length === 0}
            className="px-8"
          >
            {isCreating ? 'Creating Game...' : 'Create Game'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default GameSetup;
