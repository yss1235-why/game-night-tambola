
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Ticket, Booking, Game } from '@/types/game';
import { X } from 'lucide-react';

interface TicketBookingGridProps {
  tickets: Ticket[];
  bookings: Booking[];
  currentGame: Game;
  onBookingComplete: () => void;
}

const TicketBookingGrid: React.FC<TicketBookingGridProps> = ({
  tickets,
  bookings,
  currentGame,
  onBookingComplete
}) => {
  const { toast } = useToast();
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get booked ticket IDs for quick lookup
  const bookedTicketIds = new Set(bookings.map(b => b.ticket_id));

  // Group tickets by column (0-9, 10-19, etc.)
  const groupedTickets = tickets.reduce((acc, ticket) => {
    const column = Math.floor((ticket.ticket_number - 1) / 10);
    if (!acc[column]) acc[column] = [];
    acc[column].push(ticket);
    return acc;
  }, {} as Record<number, Ticket[]>);

  const handleTicketClick = (ticketId: number) => {
    if (bookedTicketIds.has(ticketId)) return; // Can't select booked tickets

    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleBookTickets = async () => {
    if (!playerName.trim() || selectedTickets.length === 0) {
      toast({
        title: "Error",
        description: "Please enter player name and select at least one ticket",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create bookings for all selected tickets
      const bookingPromises = selectedTickets.map(ticketId => 
        supabase
          .from('bookings')
          .insert({
            game_id: currentGame.id,
            ticket_id: ticketId,
            player_name: playerName,
            player_phone: playerPhone || null
          })
      );

      const results = await Promise.all(bookingPromises);
      
      // Check if any booking failed
      const failures = results.filter(result => result.error);
      if (failures.length > 0) {
        throw new Error('Some bookings failed');
      }

      toast({
        title: "Success",
        description: `Successfully booked ${selectedTickets.length} ticket(s) for ${playerName}`,
      });

      // Reset form
      setSelectedTickets([]);
      setPlayerName('');
      setPlayerPhone('');
      setIsBookingDialogOpen(false);
      onBookingComplete();

    } catch (error) {
      console.error('Error booking tickets:', error);
      toast({
        title: "Error",
        description: "Failed to book tickets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSelection = () => {
    setSelectedTickets([]);
  };

  const getTicketStatus = (ticketId: number) => {
    if (bookedTicketIds.has(ticketId)) return 'booked';
    if (selectedTickets.includes(ticketId)) return 'selected';
    return 'available';
  };

  const getTicketStyles = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-red-200 border-red-400 cursor-not-allowed opacity-60';
      case 'selected':
        return 'bg-blue-200 border-blue-400 cursor-pointer';
      default:
        return 'bg-green-100 border-green-300 hover:bg-green-200 cursor-pointer';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Ticket Booking</h2>
        {selectedTickets.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedTickets.length} ticket(s) selected
            </span>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              <X size={16} />
              Clear
            </Button>
            <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
              <DialogTrigger asChild>
                <Button>Book Selected Tickets</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Book {selectedTickets.length} Ticket(s)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="playerName">Player Name *</Label>
                    <Input
                      id="playerName"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter player name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="playerPhone">Player Phone (Optional)</Label>
                    <Input
                      id="playerPhone"
                      type="tel"
                      value={playerPhone}
                      onChange={(e) => setPlayerPhone(e.target.value)}
                      placeholder="+1234567890"
                      className="mt-1"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    Selected tickets: {selectedTickets.join(', ')}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleBookTickets}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsBookingDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(groupedTickets).map(([column, columnTickets]) => (
          <div key={column} className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600 text-center">
              {parseInt(column) * 10 + 1}-{(parseInt(column) + 1) * 10}
            </h3>
            <div className="space-y-1">
              {columnTickets.map(ticket => {
                const status = getTicketStatus(ticket.id);
                const booking = bookings.find(b => b.ticket_id === ticket.id);
                
                return (
                  <div
                    key={ticket.id}
                    onClick={() => handleTicketClick(ticket.id)}
                    className={`
                      p-2 border rounded text-center text-sm transition-colors
                      ${getTicketStyles(status)}
                    `}
                  >
                    <div className="font-medium">#{ticket.ticket_number}</div>
                    {booking && (
                      <div className="text-xs text-gray-600 mt-1">
                        {booking.player_name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
          <span>Booked</span>
        </div>
      </div>
    </Card>
  );
};

export default TicketBookingGrid;
