import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useGameData } from '@/hooks/useGameData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PrizeType } from '@/types/game';
import { LogOut, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TicketBookingGrid from '@/components/TicketBookingGrid';

const HostDashboard: React.FC = () => {
  const { currentGame, tickets, bookings } = useGameData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [numberCallingDelay, setNumberCallingDelay] = useState(5);
  const [hostPhone, setHostPhone] = useState('');
  const [selectedTicketSet, setSelectedTicketSet] = useState('demo-set-1');
  const [selectedPrizes, setSelectedPrizes] = useState<PrizeType[]>(['first_line', 'full_house']);
  const [isNumberCalling, setIsNumberCalling] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editDelay, setEditDelay] = useState(5);
  const [editTicketSet, setEditTicketSet] = useState('demo-set-1');
  const [editPrizes, setEditPrizes] = useState<PrizeType[]>(['first_line', 'full_house']);

  useEffect(() => {
    if (currentGame?.status === 'active' && !isNumberCalling) {
      startNumberCalling();
    }
  }, [currentGame?.status]);

  useEffect(() => {
    if (currentGame) {
      setEditDelay(currentGame.number_calling_delay || 5);
      setEditTicketSet(currentGame.ticket_set || 'demo-set-1');
      setEditPrizes((currentGame.selected_prizes as PrizeType[]) || ['first_line', 'full_house']);
    }
  }, [currentGame]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Logged out successfully!"
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive"
      });
    }
  };

  const handlePrizeToggle = (prize: PrizeType) => {
    setSelectedPrizes(prev => 
      prev.includes(prize) 
        ? prev.filter(p => p !== prize)
        : [...prev, prize]
    );
  };

  const handleEditPrizeToggle = (prize: PrizeType) => {
    setEditPrizes(prev => 
      prev.includes(prize) 
        ? prev.filter(p => p !== prize)
        : [...prev, prize]
    );
  };

  const handleEditGame = () => {
    if (currentGame) {
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateGame = async () => {
    if (!currentGame) return;

    if (editPrizes.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one prize",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('games')
        .update({
          number_calling_delay: editDelay,
          ticket_set: editTicketSet,
          selected_prizes: editPrizes as string[]
        })
        .eq('id', currentGame.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Game settings updated successfully!"
      });

      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating game:', error);
      toast({
        title: "Error",
        description: "Failed to update game settings",
        variant: "destructive"
      });
    }
  };

  const createNewGame = async () => {
    if (!hostPhone.trim()) {
      toast({
        title: "Error",
        description: "Please enter a WhatsApp phone number",
        variant: "destructive"
      });
      return;
    }

    if (selectedPrizes.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one prize",
        variant: "destructive"
      });
      return;
    }

    try {
      // First, create a host record
      const { data: hostData, error: hostError } = await supabase
        .from('hosts')
        .insert([{
          email: 'temp@example.com', // Temporary email until proper auth
          name: 'Host', // Temporary name
          phone: hostPhone
        }])
        .select()
        .single();

      if (hostError) {
        console.error('Error creating host:', hostError);
        throw hostError;
      }

      // Then create the game with the host_id
      const { data, error } = await supabase
        .from('games')
        .insert([{
          host_id: hostData.id,
          status: 'waiting',
          number_calling_delay: numberCallingDelay,
          host_phone: hostPhone,
          ticket_set: selectedTicketSet,
          selected_prizes: selectedPrizes as string[]
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "New game created successfully!"
      });

      // Reset form
      setHostPhone('');
      setSelectedPrizes(['first_line', 'full_house']);
      setSelectedTicketSet('demo-set-1');
      setNumberCallingDelay(5);
    } catch (error) {
      console.error('Error creating game:', error);
      toast({
        title: "Error",
        description: "Failed to create new game",
        variant: "destructive"
      });
    }
  };

  const startGame = async () => {
    if (!currentGame) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', currentGame.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Game started!"
      });
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: "Error",
        description: "Failed to start game",
        variant: "destructive"
      });
    }
  };

  const pauseGame = async () => {
    if (!currentGame) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({ status: 'paused' })
        .eq('id', currentGame.id);

      if (error) throw error;

      setIsNumberCalling(false);
      toast({
        title: "Success",
        description: "Game paused!"
      });
    } catch (error) {
      console.error('Error pausing game:', error);
    }
  };

  const endGame = async () => {
    if (!currentGame) return;

    try {
      const { error } = await supabase
        .from('games')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', currentGame.id);

      if (error) throw error;

      setIsNumberCalling(false);
      toast({
        title: "Success",
        description: "Game ended!"
      });
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const startNumberCalling = () => {
    if (!currentGame || currentGame.status !== 'active') return;

    setIsNumberCalling(true);
    
    const callNextNumber = async () => {
      if (!currentGame || currentGame.status !== 'active') {
        setIsNumberCalling(false);
        return;
      }

      const calledNumbers = currentGame.numbers_called || [];
      const availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1)
        .filter(num => !calledNumbers.includes(num));

      if (availableNumbers.length === 0) {
        setIsNumberCalling(false);
        return;
      }

      // Check if admin has set winners and manipulate number calling
      const { data: adminSettings } = await supabase
        .from('admin_winner_settings')
        .select('*')
        .eq('game_id', currentGame.id);

      let nextNumber;
      
      if (adminSettings && adminSettings.length > 0) {
        // Implement smart number calling to ensure admin-set winners win
        // This is a simplified version - in real implementation, you'd need
        // sophisticated logic to ensure the right ticket wins at the right time
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        nextNumber = availableNumbers[randomIndex];
      } else {
        // Regular random number calling
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        nextNumber = availableNumbers[randomIndex];
      }

      const newCalledNumbers = [...calledNumbers, nextNumber];

      try {
        const { error } = await supabase
          .from('games')
          .update({
            current_number: nextNumber,
            numbers_called: newCalledNumbers
          })
          .eq('id', currentGame.id);

        if (error) throw error;

        // Schedule next number
        setTimeout(callNextNumber, (currentGame.number_calling_delay || 5) * 1000);
      } catch (error) {
        console.error('Error calling number:', error);
        setIsNumberCalling(false);
      }
    };

    callNextNumber();
  };

  const handleBookingComplete = () => {
    // Trigger refresh of game data
    window.location.reload();
  };

  const prizeOptions: { value: PrizeType; label: string }[] = [
    { value: 'first_line', label: 'First Line' },
    { value: 'second_line', label: 'Second Line' },
    { value: 'third_line', label: 'Third Line' },
    { value: 'full_house', label: 'Full House' },
    { value: 'early_five', label: 'Early Five' },
    { value: 'corners', label: 'Corners' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Host Dashboard</h1>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Game Setup</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hostPhone">WhatsApp Phone Number</Label>
                  <Input
                    id="hostPhone"
                    type="tel"
                    placeholder="+1234567890"
                    value={hostPhone}
                    onChange={(e) => setHostPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="ticketSet">Ticket Set</Label>
                  <Select value={selectedTicketSet} onValueChange={setSelectedTicketSet}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select ticket set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo-set-1">Demo Set 1 (100 tickets)</SelectItem>
                      <SelectItem value="demo-set-2">Demo Set 2 (150 tickets)</SelectItem>
                      <SelectItem value="demo-set-3">Demo Set 3 (200 tickets)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Prize Selection</Label>
                  <div className="mt-2 space-y-2">
                    {prizeOptions.map((prize) => (
                      <div key={prize.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={prize.value}
                          checked={selectedPrizes.includes(prize.value)}
                          onChange={() => handlePrizeToggle(prize.value)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={prize.value} className="text-sm">{prize.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="delay">Number Calling Delay (seconds)</Label>
                  <Input
                    id="delay"
                    type="number"
                    min="2"
                    max="10"
                    value={numberCallingDelay}
                    onChange={(e) => setNumberCallingDelay(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>

                <div className="space-y-2">
                  {!currentGame && (
                    <Button onClick={createNewGame} className="w-full">
                      Create New Game
                    </Button>
                  )}
                  
                  {currentGame?.status === 'waiting' && (
                    <Button onClick={startGame} className="w-full bg-green-600">
                      Start Game
                    </Button>
                  )}
                  
                  {currentGame?.status === 'active' && (
                    <>
                      <Button onClick={pauseGame} className="w-full bg-yellow-600">
                        Pause Game
                      </Button>
                      <Button onClick={endGame} className="w-full bg-red-600">
                        End Game
                      </Button>
                    </>
                  )}
                  
                  {currentGame?.status === 'paused' && (
                    <Button onClick={startGame} className="w-full bg-green-600">
                      Resume Game
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Game Status</h2>
                {currentGame && (
                  <Button 
                    onClick={handleEditGame}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit size={16} />
                    Edit Game
                  </Button>
                )}
              </div>
              {currentGame ? (
                <div className="space-y-2">
                  <p><strong>Status:</strong> {currentGame.status}</p>
                  <p><strong>Current Number:</strong> {currentGame.current_number || 'None'}</p>
                  <p><strong>Numbers Called:</strong> {currentGame.numbers_called?.length || 0}</p>
                  <p><strong>Delay:</strong> {currentGame.number_calling_delay}s</p>
                  <p><strong>Host Phone:</strong> {currentGame.host_phone || 'Not set'}</p>
                  <p><strong>Ticket Set:</strong> {currentGame.ticket_set || 'Not set'}</p>
                  <p><strong>Selected Prizes:</strong> {currentGame.selected_prizes?.join(', ') || 'None'}</p>
                </div>
              ) : (
                <p className="text-gray-500">No active game</p>
              )}
            </div>
          </div>
        </Card>

        {/* Ticket Booking Section */}
        {currentGame && (
          <TicketBookingGrid
            tickets={tickets}
            bookings={bookings}
            currentGame={currentGame}
            onBookingComplete={handleBookingComplete}
          />
        )}

        {/* Edit Game Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Game Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTicketSet">Ticket Set</Label>
                <Select value={editTicketSet} onValueChange={setEditTicketSet}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select ticket set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo-set-1">Demo Set 1 (100 tickets)</SelectItem>
                    <SelectItem value="demo-set-2">Demo Set 2 (150 tickets)</SelectItem>
                    <SelectItem value="demo-set-3">Demo Set 3 (200 tickets)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prize Selection</Label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {prizeOptions.map((prize) => (
                    <div key={prize.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-${prize.value}`}
                        checked={editPrizes.includes(prize.value)}
                        onChange={() => handleEditPrizeToggle(prize.value)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`edit-${prize.value}`} className="text-sm">{prize.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="editDelay">Number Calling Delay (seconds)</Label>
                <Input
                  id="editDelay"
                  type="number"
                  min="2"
                  max="10"
                  value={editDelay}
                  onChange={(e) => setEditDelay(Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleUpdateGame}
                  className="flex-1"
                >
                  Update Game
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default HostDashboard;
