import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Ticket, Booking, Game } from '@/types/game';
import { X, Edit } from 'lucide-react';

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
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerPhone, setEditPlayerPhone] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Get booked ticket IDs for quick lookup
  const bookedTicketIds = new Set(bookings.map(b => b.ticket_id));

  // Filter tickets based on max_tickets setting
  const maxTickets = currentGame.max_tickets || 100;
  const availableTickets = tickets.filter(ticket => ticket.ticket_number <= maxTickets);

  // Create rows with exactly 10 tickets per row
  const createTicketRows = () => {
    const rows: Ticket[][] = [];
    const ticketMap = new Map(availableTickets.map(ticket => [ticket.ticket_number, ticket]));
    
    // Calculate number of rows needed (each row has 10 tickets)
    const numRows = Math.ceil(maxTickets / 10);
    
    for (let row = 0; row < numRows; row++) {
      const rowTickets: Ticket[] = [];
      for (let col = 1; col <= 10; col++) {
        const ticketNumber = row * 10 + col;
        if (ticketNumber <= maxTickets) {
          const ticket = ticketMap.get(ticketNumber);
          if (ticket) {
            rowTickets.push(ticket);
          }
        }
      }
      if (rowTickets.length > 0) {
        rows.push(rowTickets);
      }
    }
    
    return rows;
  };

  const ticketRows = createTicketRows();

  const handleTicketClick = (ticketId: number) => {
    if (bookedTicketIds.has(ticketId)) return; // Can't select booked tickets

    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setEditPlayerName(booking.player_name);
    setEditPlayerPhone(booking.player_phone || '');
    setIsEditDialogOpen(true);
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking || !editPlayerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter player name",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          player_name: editPlayerName,
          player_phone: editPlayerPhone || null
        })
        .eq('id', editingBooking.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingBooking(null);
      setEditPlayerName('');
      setEditPlayerPhone('');
      onBookingComplete();

    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
    <>
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Ticket Booking (Max: {maxTickets} tickets)</h2>
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

        <div className="space-y-3">
          {ticketRows.map((row, rowIndex) => (
            <div key={rowIndex} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600 text-center">
                Tickets {rowIndex * 10 + 1}-{Math.min((rowIndex + 1) * 10, maxTickets)}
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {row.map(ticket => {
                  const status = getTicketStatus(ticket.id);
                  const booking = bookings.find(b => b.ticket_id === ticket.id);
                  
                  return (
                    <div key={ticket.id}>
                      <div
                        onClick={() => handleTicketClick(ticket.id)}
                        className={`
                          p-2 border rounded text-center text-sm transition-colors min-h-[48px] flex flex-col justify-center
                          ${getTicketStyles(status)}
                        `}
                      >
                        <div className="font-medium">{ticket.ticket_number}</div>
                        {booking && (
                          <div className="text-xs text-gray-600 mt-1 truncate">
                            {booking.player_name}
                          </div>
                        )}
                      </div>
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

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Bookings ({bookings.length})</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {bookings.length > 0 ? (
            bookings.map(booking => (
              <div key={booking.id} className="flex justify-between items-center p-3 bg-gray-100 rounded">
                <div className="flex-1">
                  <span className="font-medium">Ticket {booking.ticket_id}</span>
                  <span className="ml-4">{booking.player_name}</span>
                  <span className="ml-4 text-gray-600">{booking.player_phone}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditBooking(booking)}
                  className="flex items-center gap-1"
                >
                  <Edit size={14} />
                  Edit
                </Button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No bookings yet</p>
          )}
        </div>
      </Card>

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booking - Ticket {editingBooking?.ticket_id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editPlayerName">Player Name *</Label>
              <Input
                id="editPlayerName"
                value={editPlayerName}
                onChange={(e) => setEditPlayerName(e.target.value)}
                placeholder="Enter player name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="editPlayerPhone">Player Phone (Optional)</Label>
              <Input
                id="editPlayerPhone"
                type="tel"
                value={editPlayerPhone}
                onChange={(e) => setEditPlayerPhone(e.target.value)}
                placeholder="+1234567890"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleUpdateBooking}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Updating...' : 'Update Booking'}
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
    </>
  );
};

export default TicketBookingGrid;
