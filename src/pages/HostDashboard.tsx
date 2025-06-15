import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useGameData } from '@/hooks/useGameData';
import { supabase } from '@/integrations/supabase/client';
import { PrizeType } from '@/types/game';
import { LogOut, Edit, Pause, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import TicketBookingGrid from '@/components/TicketBookingGrid';
import NumberGrid from '@/components/NumberGrid';
import WinnersList from '@/components/WinnersList';

const HostDashboard: React.FC = () => {
  const { currentGame, tickets, bookings, winners } = useGameData();
  const navigate = useNavigate();
  const [numberCallingDelay, setNumberCallingDelay] = useState(5);
  const [hostPhone, setHostPhone] = useState('');
  const [selectedTicketSet, setSelectedTicketSet] = useState('demo-set-1');
  const [selectedPrizes, setSelectedPrizes] = useState<PrizeType[]>(['first_line', 'full_house']);
  const [maxTickets, setMaxTickets] = useState(100);
  const [isNumberCalling, setIsNumberCalling] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editDelay, setEditDelay] = useState(5);
  const [editTicketSet, setEditTicketSet] = useState('demo-set-1');
  const [editPrizes, setEditPrizes] = useState<PrizeType[]>(['first_line', 'full_house']);
  const [editHostPhone, setEditHostPhone] = useState('');
  const [editMaxTickets, setEditMaxTickets] = useState(100);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Function to play number announcement
  const playNumberAudio = (number: number) => {
    if (!audioContextRef.current) return;

    // Create a simple beep followed by speech synthesis
    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);

    // Use speech synthesis for number announcement
    setTimeout(() => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`Number ${number}`);
        utterance.rate = 0.8;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
      }
    }, 400);
  };

  // Debug effect to log game status changes
  useEffect(() => {
    console.log('Current game status changed:', currentGame?.status);
    console.log('Current game object:', currentGame);
  }, [currentGame?.status, currentGame]);

  useEffect(() => {
    console.log('Game status changed:', currentGame?.status, 'isNumberCalling:', isNumberCalling);
    if (currentGame?.status === 'active' && !isNumberCalling) {
      console.log('Starting number calling because game is active');
      startNumberCalling();
    } else if (currentGame?.status === 'paused' || currentGame?.status === 'ended') {
      console.log('Stopping number calling because game is paused/ended');
      setIsNumberCalling(false);
    }
  }, [currentGame?.status, isNumberCalling]);

  useEffect(() => {
    if (currentGame) {
      setEditDelay(currentGame.number_calling_delay || 5);
      setEditTicketSet(currentGame.ticket_set || 'demo-set-1');
      setEditPrizes((currentGame.selected_prizes as PrizeType[]) || ['first_line', 'full_house']);
      setEditHostPhone(currentGame.host_phone || '');
      setEditMaxTickets(currentGame.max_tickets || 100);
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

    if (!editHostPhone.trim()) {
      toast({
        title: "Error",
        description: "Please enter a WhatsApp phone number",
        variant: "destructive"
      });
      return;
    }

    if (editMaxTickets < 1 || editMaxTickets > 1000) {
      toast({
        title: "Error",
        description: "Max tickets must be between 1 and 1000",
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
          selected_prizes: editPrizes as string[],
          host_phone: editHostPhone,
          max_tickets: editMaxTickets
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

    if (maxTickets < 1 || maxTickets > 1000) {
      toast({
        title: "Error",
        description: "Max tickets must be between 1 and 1000",
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
          selected_prizes: selectedPrizes as string[],
          max_tickets: maxTickets
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
      setMaxTickets(100);
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
      console.log('Pausing game, current status:', currentGame.status);
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

  const resumeGame = async () => {
    if (!currentGame) return;

    try {
      console.log('Resuming game, current status:', currentGame.status);
      const { error } = await supabase
        .from('games')
        .update({ status: 'active' })
        .eq('id', currentGame.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Game resumed!"
      });
    } catch (error) {
      console.error('Error resuming game:', error);
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

  const startNumberCalling = async () => {
    if (!currentGame || currentGame.status !== 'active') {
      console.log('Cannot start number calling - game not active');
      return;
    }

    console.log('Starting number calling...');
    setIsNumberCalling(true);
    
    const callNextNumber = async () => {
      // Re-fetch current game state to ensure we have the latest data
      const { data: latestGame } = await supabase
        .from('games')
        .select('*')
        .eq('id', currentGame.id)
        .single();

      if (!latestGame || latestGame.status !== 'active') {
        console.log('Stopping number calling - game no longer active');
        setIsNumberCalling(false);
        return;
      }

      const calledNumbers = latestGame.numbers_called || [];
      const availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1)
        .filter(num => !calledNumbers.includes(num));

      if (availableNumbers.length === 0) {
        console.log('No more numbers to call');
        setIsNumberCalling(false);
        return;
      }

      let nextNumber;
      
      // Check if admin has set winners
      const { data: adminSettings } = await supabase
        .from('admin_winner_settings')
        .select('*')
        .eq('game_id', currentGame.id);

      if (adminSettings && adminSettings.length > 0) {
        // Smart number calling to ensure admin-set winners win
        // For now, we'll use random but this can be enhanced with actual logic
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        nextNumber = availableNumbers[randomIndex];
        console.log('Admin winners set - using smart calling');
      } else {
        // Regular random number calling
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        nextNumber = availableNumbers[randomIndex];
        console.log('No admin winners - using random calling');
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

        // Play audio for the called number
        playNumberAudio(nextNumber);

        // Schedule next number
        setTimeout(callNextNumber, (latestGame.number_calling_delay || 5) * 1000);
      } catch (error) {
        console.error('Error calling number:', error);
        setIsNumberCalling(false);
      }
    };

    callNextNumber();
  };

  const handleBookingComplete = () => {
    // The useGameData hook will automatically update via real-time subscriptions
  };

  const prizeOptions: { value: PrizeType; label: string }[] = [
    { value: 'first_line', label: 'First Line' },
    { value: 'second_line', label: 'Second Line' },
    { value: 'third_line', label: 'Third Line' },
    { value: 'full_house', label: 'Full House' },
    { value: 'early_five', label: 'Early Five' },
    { value: 'corners', label: 'Corners' }
  ];

  const showGameSetup = !currentGame || currentGame.status === 'ended';
  const showTicketBooking = currentGame && currentGame.status === 'waiting';

  // Helper function to get button text and action based on current status
  const getGameControlButton = () => {
    if (!currentGame) return null;

    console.log('Rendering button for status:', currentGame.status);

    switch (currentGame.status) {
      case 'waiting':
        return (
          <Button onClick={startGame} className="w-full bg-green-600">
            <Play size={16} className="mr-2" />
            Start Game
          </Button>
        );
      case 'active':
        return (
          <Button onClick={pauseGame} className="w-full bg-yellow-600">
            <Pause size={16} className="mr-2" />
            Pause Game
          </Button>
        );
      case 'paused':
        return (
          <Button onClick={resumeGame} className="w-full bg-green-600">
            <Play size={16} className="mr-2" />
            Resume Game
          </Button>
        );
      default:
        return null;
    }
  };

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
            {showGameSetup && (
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
                        <SelectItem value="demo-set-1">Demo Set 1</SelectItem>
                        <SelectItem value="demo-set-2">Demo Set 2</SelectItem>
                        <SelectItem value="demo-set-3">Demo Set 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="maxTickets">Maximum Tickets Available</Label>
                    <Input
                      id="maxTickets"
                      type="number"
                      min="1"
                      max="1000"
                      value={maxTickets}
                      onChange={(e) => setMaxTickets(Number(e.target.value))}
                      className="mt-1"
                    />
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

                  <Button onClick={createNewGame} className="w-full">
                    Create New Game
                  </Button>
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Game Status</h2>
                {currentGame && currentGame.status !== 'ended' && (
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
                  <p><strong>Max Tickets:</strong> {currentGame.max_tickets || 100}</p>
                  <p><strong>Delay:</strong> {currentGame.number_calling_delay}s</p>
                  <p><strong>Host Phone:</strong> {currentGame.host_phone || 'Not set'}</p>
                  <p><strong>Ticket Set:</strong> {currentGame.ticket_set || 'Not set'}</p>
                  <p><strong>Selected Prizes:</strong> {currentGame.selected_prizes?.join(', ') || 'None'}</p>
                  <p><strong>Number Calling Active:</strong> {isNumberCalling ? 'Yes' : 'No'}</p>
                  
                  <div className="space-y-2 mt-4">
                    {getGameControlButton()}
                    
                    {(currentGame.status === 'active' || currentGame.status === 'paused') && (
                      <Button onClick={endGame} className="w-full bg-red-600">
                        End Game
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No active game</p>
              )}
            </div>
          </div>
        </Card>

        {/* Number Grid - Show when game is active or paused */}
        {currentGame && (currentGame.status === 'active' || currentGame.status === 'paused') && (
          <NumberGrid 
            calledNumbers={currentGame.numbers_called || []}
            currentNumber={currentGame.current_number}
          />
        )}

        {/* Winners Section - Show when there are winners */}
        {currentGame && winners.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Game Winners</h2>
            <WinnersList 
              winners={winners}
              tickets={tickets}
              bookings={bookings}
            />
          </Card>
        )}

        {/* Ticket Booking Section - Only show when game is waiting */}
        {showTicketBooking && (
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
                <Label htmlFor="editHostPhone">WhatsApp Phone Number</Label>
                <Input
                  id="editHostPhone"
                  type="tel"
                  placeholder="+1234567890"
                  value={editHostPhone}
                  onChange={(e) => setEditHostPhone(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="editTicketSet">Ticket Set</Label>
                <Select value={editTicketSet} onValueChange={setEditTicketSet}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select ticket set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo-set-1">Demo Set 1</SelectItem>
                    <SelectItem value="demo-set-2">Demo Set 2</SelectItem>
                    <SelectItem value="demo-set-3">Demo Set 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="editMaxTickets">Maximum Tickets Available</Label>
                <Input
                  id="editMaxTickets"
                  type="number"
                  min="1"
                  max="1000"
                  value={editMaxTickets}
                  onChange={(e) => setEditMaxTickets(Number(e.target.value))}
                  className="mt-1"
                />
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
