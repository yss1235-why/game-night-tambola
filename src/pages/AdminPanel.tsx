
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useGameData } from '@/hooks/useGameData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PrizeType } from '@/types/game';
import { Trash2, LogOut } from 'lucide-react';
import NumberGrid from '@/components/NumberGrid';
import WinnersList from '@/components/WinnersList';
import CreateHostForm from '@/components/CreateHostForm';
import HostManagement from '@/components/HostManagement';

interface Host {
  id: string;
  name: string;
  email: string;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { currentGame, tickets, bookings, winners } = useGameData();
  const [selectedTicketNumber, setSelectedTicketNumber] = useState('');
  const [selectedPrizeType, setSelectedPrizeType] = useState<PrizeType>('first_line');
  const [selectedHostId, setSelectedHostId] = useState('');
  const [hosts, setHosts] = useState<Host[]>([]);
  const [adminWinners, setAdminWinners] = useState<{ticketNumber: number, prizeType: PrizeType, hostId: string}[]>([]);
  const [activeTab, setActiveTab] = useState<'winners' | 'hosts' | 'management'>('winners');

  const prizeOptions: { value: PrizeType; label: string }[] = [
    { value: 'first_line', label: 'First Line' },
    { value: 'second_line', label: 'Second Line' },
    { value: 'third_line', label: 'Third Line' },
    { value: 'full_house', label: 'Full House' },
    { value: 'early_five', label: 'Early Five' },
    { value: 'corners', label: 'Corners' }
  ];

  useEffect(() => {
    fetchHosts();
  }, []);

  const fetchHosts = async () => {
    try {
      const { data, error } = await supabase
        .from('hosts')
        .select('id, name, email')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setHosts(data || []);
    } catch (error) {
      console.error('Error fetching hosts:', error);
    }
  };

  const handleAddWinner = () => {
    const ticketNumber = parseInt(selectedTicketNumber);
    if (!ticketNumber || !selectedPrizeType || !selectedHostId) {
      toast({
        title: "Error",
        description: "Please select ticket number, prize type, and host",
        variant: "destructive"
      });
      return;
    }

    // Check if ticket exists
    const ticket = tickets.find(t => t.ticket_number === ticketNumber);
    if (!ticket) {
      toast({
        title: "Error",
        description: "Ticket not found",
        variant: "destructive"
      });
      return;
    }

    // Check if this combination already exists
    const exists = adminWinners.some(w => 
      w.ticketNumber === ticketNumber && w.prizeType === selectedPrizeType
    );
    
    if (exists) {
      toast({
        title: "Error",
        description: "This ticket and prize combination already exists",
        variant: "destructive"
      });
      return;
    }

    setAdminWinners(prev => [...prev, { ticketNumber, prizeType: selectedPrizeType, hostId: selectedHostId }]);
    setSelectedTicketNumber('');
    toast({
      title: "Success",
      description: "Winner added to admin list"
    });
  };

  const handleRemoveWinner = (ticketNumber: number, prizeType: PrizeType) => {
    setAdminWinners(prev => prev.filter(w => 
      !(w.ticketNumber === ticketNumber && w.prizeType === prizeType)
    ));
  };

  const handleCreateWinner = async (ticketNumber: number, prizeType: PrizeType) => {
    if (!currentGame) {
      toast({
        title: "Error",
        description: "No active game found",
        variant: "destructive"
      });
      return;
    }

    const ticket = tickets.find(t => t.ticket_number === ticketNumber);
    if (!ticket) {
      toast({
        title: "Error",
        description: "Ticket not found",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('winners')
        .insert([{
          game_id: currentGame.id,
          ticket_id: ticket.id,
          prize_type: prizeType
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Winner created successfully!"
      });

      // Remove from admin winners list
      handleRemoveWinner(ticketNumber, prizeType);

    } catch (error) {
      console.error('Error creating winner:', error);
      toast({
        title: "Error",
        description: "Failed to create winner",
        variant: "destructive"
      });
    }
  };

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

  const getHostName = (hostId: string) => {
    const host = hosts.find(h => h.id === hostId);
    return host ? host.name : 'Unknown Host';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate('/host')}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                Host Dashboard
              </Button>
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                Player View
              </Button>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          </div>

          {/* Game Status */}
          {currentGame && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Current Game Status</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><strong>Status:</strong> {currentGame.status}</div>
                <div><strong>Current Number:</strong> {currentGame.current_number || 'None'}</div>
                <div><strong>Numbers Called:</strong> {currentGame.numbers_called?.length || 0}/90</div>
                <div><strong>Total Winners:</strong> {winners.length}</div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6">
            <Button
              variant={activeTab === 'winners' ? 'default' : 'outline'}
              onClick={() => setActiveTab('winners')}
            >
              Winner Management
            </Button>
            <Button
              variant={activeTab === 'hosts' ? 'default' : 'outline'}
              onClick={() => setActiveTab('hosts')}
            >
              Create Host
            </Button>
            <Button
              variant={activeTab === 'management' ? 'default' : 'outline'}
              onClick={() => setActiveTab('management')}
            >
              Host Management
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === 'winners' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Manage Winners</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label>Host</Label>
                    <Select value={selectedHostId} onValueChange={setSelectedHostId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select host" />
                      </SelectTrigger>
                      <SelectContent>
                        {hosts.map((host) => (
                          <SelectItem key={host.id} value={host.id}>
                            {host.name} ({host.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ticketNumber">Ticket Number</Label>
                    <Input
                      id="ticketNumber"
                      type="number"
                      value={selectedTicketNumber}
                      onChange={(e) => setSelectedTicketNumber(e.target.value)}
                      placeholder="Enter ticket number..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Prize Type</Label>
                    <Select value={selectedPrizeType} onValueChange={(value: PrizeType) => setSelectedPrizeType(value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select prize type" />
                      </SelectTrigger>
                      <SelectContent>
                        {prizeOptions.map((prize) => (
                          <SelectItem key={prize.value} value={prize.value}>
                            {prize.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleAddWinner} className="w-full">
                    Add to Winner List
                  </Button>
                </div>

                {adminWinners.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">Admin Winner List</h3>
                    <div className="space-y-2">
                      {adminWinners.map((winner, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <div>
                            <span className="font-medium">Ticket #{winner.ticketNumber}</span>
                            <span className="ml-2 text-gray-600">
                              {prizeOptions.find(p => p.value === winner.prizeType)?.label}
                            </span>
                            <div className="text-sm text-gray-500">
                              Host: {getHostName(winner.hostId)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleCreateWinner(winner.ticketNumber, winner.prizeType)}
                              className="bg-green-600"
                            >
                              Create Winner
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveWinner(winner.ticketNumber, winner.prizeType)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Current Winners */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Current Game Winners</h2>
                {winners.length > 0 ? (
                  <WinnersList 
                    winners={winners}
                    tickets={tickets}
                    bookings={bookings}
                  />
                ) : (
                  <Card className="p-4">
                    <p className="text-gray-500 text-center">No winners yet</p>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === 'hosts' && (
            <CreateHostForm onHostCreated={fetchHosts} />
          )}

          {activeTab === 'management' && (
            <HostManagement />
          )}
        </Card>

        {/* Number Grid */}
        {currentGame && (currentGame.status === 'active' || currentGame.status === 'paused') && (
          <NumberGrid 
            calledNumbers={currentGame.numbers_called || []}
            currentNumber={currentGame.current_number}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
