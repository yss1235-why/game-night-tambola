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
import WinnersList from '@/components/WinnersList';
import CreateHostForm from '@/components/CreateHostForm';
import HostManagement from '@/components/HostManagement';
import SheetValidation from '@/components/SheetValidation';
import { getWinningHalfSheet, getWinningFullSheet } from '@/utils/sheetValidation';

interface Host {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { currentGame, tickets, bookings, winners } = useGameData();
  const [selectedTicketNumber, setSelectedTicketNumber] = useState('');
  const [selectedPrizeType, setSelectedPrizeType] = useState<PrizeType>('quick_five');
  const [selectedHostId, setSelectedHostId] = useState('');
  const [hosts, setHosts] = useState<Host[]>([]);
  const [adminWinners, setAdminWinners] = useState<{ticketNumber: number, prizeType: PrizeType, hostId: string}[]>([]);
  const [activeTab, setActiveTab] = useState<'winners' | 'hosts' | 'management'>('winners');
  const [isLoading, setIsLoading] = useState(true);

  const prizeOptions: { value: PrizeType; label: string }[] = [
    { value: 'quick_five', label: 'Quick 5' },
    { value: 'corners', label: 'Corners' },
    { value: 'star_corners', label: 'Star Corners' },
    { value: 'top_line', label: 'Top Line' },
    { value: 'middle_line', label: 'Middle Line' },
    { value: 'bottom_line', label: 'Bottom Line' },
    { value: 'half_sheet', label: 'Half Sheet' },
    { value: 'full_sheet', label: 'Full Sheet' },
    { value: 'full_house', label: 'Full House' },
    { value: 'second_full_house', label: '2nd Full House' }
  ];

  useEffect(() => {
    fetchHosts();
  }, []);

  const fetchHosts = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching hosts from database...');
      
      const { data, error } = await supabase
        .from('hosts')
        .select('id, name, email, phone, is_active')
        .order('name');

      if (error) {
        console.error('Error fetching hosts:', error);
        throw error;
      }
      
      console.log('Fetched hosts:', data);
      setHosts(data || []);
    } catch (error) {
      console.error('Error fetching hosts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch hosts from database",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
    return host ? `${host.name} (${host.email})` : 'Unknown Host';
  };

  const checkForSheetWinners = async () => {
    if (!currentGame || currentGame.status !== 'active' || !currentGame.selected_prizes) {
      return;
    }

    const maxTickets = currentGame.max_tickets || 100;

    // Check for half sheet winner
    if (currentGame.selected_prizes.includes('half_sheet') && !winners.some(w => w.prize_type === 'half_sheet')) {
      const winningHalfSheet = getWinningHalfSheet(bookings, tickets, currentGame.numbers_called, maxTickets);
      if (winningHalfSheet) {
        const firstTicket = tickets.find(t => t.ticket_number === winningHalfSheet.tickets[0]);
        if (firstTicket) {
          await handleCreateWinner(firstTicket.ticket_number, 'half_sheet');
          console.log('Half sheet winner detected:', winningHalfSheet);
        }
      }
    }

    // Check for full sheet winner
    if (currentGame.selected_prizes.includes('full_sheet') && !winners.some(w => w.prize_type === 'full_sheet')) {
      const winningFullSheet = getWinningFullSheet(bookings, tickets, currentGame.numbers_called, maxTickets);
      if (winningFullSheet) {
        const firstTicket = tickets.find(t => t.ticket_number === winningFullSheet.tickets[0]);
        if (firstTicket) {
          await handleCreateWinner(firstTicket.ticket_number, 'full_sheet');
          console.log('Full sheet winner detected:', winningFullSheet);
        }
      }
    }
  };

  useEffect(() => {
    if (currentGame && currentGame.status === 'active') {
      checkForSheetWinners();
    }
  }, [currentGame?.numbers_called, bookings, winners]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 flex items-center justify-center">
        <div className="text-lg">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center">Admin Panel</h1>
      
      {isLoading ? (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 flex items-center justify-center">
          <div className="text-lg">Loading admin panel...</div>
        </div>
      ) : !currentGame ? (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 flex items-center justify-center">
          <div className="text-lg">No active game found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </Button>
              </div>

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

              {/* Debug info */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Database Status:</strong> Found {hosts.length} hosts in database
                  {hosts.length > 0 && (
                    <span className="ml-2">
                      - Active: {hosts.filter(h => h.is_active).length}
                    </span>
                  )}
                </p>
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
                            <SelectValue placeholder={hosts.length > 0 ? "Select host" : "No hosts found"} />
                          </SelectTrigger>
                          <SelectContent>
                            {hosts.length > 0 ? (
                              hosts.map((host) => (
                                <SelectItem key={host.id} value={host.id}>
                                  {host.name} ({host.email}) {!host.is_active && '(Inactive)'}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-hosts" disabled>
                                No hosts available
                              </SelectItem>
                            )}
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

                      <Button onClick={handleAddWinner} className="w-full" disabled={hosts.length === 0}>
                        {hosts.length > 0 ? 'Add to Winner List' : 'No hosts available'}
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
          </div>
          
          <div className="space-y-6">
            {/* Add Sheet Validation Component */}
            <SheetValidation
              bookings={bookings}
              tickets={tickets}
              calledNumbers={currentGame.numbers_called}
              maxTickets={currentGame.max_tickets || 100}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
