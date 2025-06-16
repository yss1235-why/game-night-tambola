import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, Booking, Game } from '@/types/game';
import { loadTicketFromSet } from '@/utils/ticketSetLoader';
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

  // Create a map of ticket numbers to bookings for quick lookup
  const bookedTicketNumbers = new Set(
    bookings.map(booking => {
      const ticket = tickets.find(t => t.id === booking.ticket_id);
      return ticket?.ticket_number;
    }).filter(Boolean)
  );

  // Filter tickets based on max_tickets setting
  const maxTickets = currentGame.max_tickets || 100;

  // Create a map of existing tickets for quick lookup
  const ticketMap = new Map(tickets.map(ticket => [ticket.ticket_number, ticket]));

  // Sort bookings by ticket number in ascending order
  const sortedBookings = [...bookings].sort((a, b) => {
    const ticketA = tickets.find(t => t.id === a.ticket_id);
    const ticketB = tickets.find(t => t.id === b.ticket_id);
    const numberA = ticketA?.ticket_number || 0;
    const numberB = ticketB?.ticket_number || 0;
    return numberA - numberB;
  });

  // Clear selection when bookings change to avoid UI inconsistencies
  useEffect(() => {
    const invalidSelections = selectedTickets.filter(ticketId => {
      if (ticketId < 0) {
        // Temporary ticket - check if ticket number is now booked
        const ticketNumber = -ticketId;
        return bookedTicketNumbers.has(ticketNumber);
      } else {
        // Real ticket - check if it's now booked
        return bookedTicketIds.has(ticketId);
      }
    });

    if (invalidSelections.length > 0) {
      console.log('Clearing invalid selections due to real-time booking updates:', invalidSelections);
      setSelectedTickets(prev => prev.filter(id => !invalidSelections.includes(id)));
    }
  }, [bookedTicketIds, bookedTicketNumbers, selectedTickets]);

  // Create rows with exactly 10 tickets per row, showing all numbers from 1 to maxTickets
  const createTicketRows = () => {
    const rows: { ticketNumber: number; ticket?: Ticket }[][] = [];
    
    // Calculate number of rows needed (each row has 10 tickets)
    const numRows = Math.ceil(maxTickets / 10);
    
    for (let row = 0; row < numRows; row++) {
      const rowTickets: { ticketNumber: number; ticket?: Ticket }[] = [];
      for (let col = 1; col <= 10; col++) {
        const ticketNumber = row * 10 + col;
        if (ticketNumber <= maxTickets) {
          const ticket = ticketMap.get(ticketNumber);
          rowTickets.push({ ticketNumber, ticket });
        }
      }
      if (rowTickets.length > 0) {
        rows.push(rowTickets);
      }
    }
    
    return rows;
  };

  const ticketRows = createTicketRows();

  const handleTicketClick = (ticketNumber: number) => {
    console.log('Ticket clicked:', ticketNumber);
    
    // Check if this ticket number is already booked
    if (bookedTicketNumbers.has(ticketNumber)) {
      console.log('Ticket number already booked:', ticketNumber);
      return; // Prevent selecting booked tickets
    }
    
    // Find the actual ticket ID for this ticket number
    const ticket = ticketMap.get(ticketNumber);
    if (!ticket) {
      // For tickets that don't exist in the database yet, we need to create them first
      console.log(`Ticket ${ticketNumber} does not exist, need to create it first`);
      
      // Create a temporary ID for selection (negative to distinguish from real IDs)
      const tempId = -ticketNumber;
      setSelectedTickets(prev => 
        prev.includes(tempId) 
          ? prev.filter(id => id !== tempId)
          : [...prev, tempId]
      );
      return;
    }

    const ticketId = ticket.id;
    if (bookedTicketIds.has(ticketId)) {
      console.log('Ticket already booked:', ticketId);
      return; // Can't select booked tickets
    }

    console.log('Selecting/deselecting ticket:', ticketId);
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleEditBooking = async (booking: Booking) => {
    setEditingBooking(booking);
    setEditPlayerName(booking.player_name);
    setEditPlayerPhone(booking.player_phone || '');
    setIsEditDialogOpen(true);
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking || !editPlayerName.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Updating booking:', editingBooking.id);
      const { error } = await supabase
        .from('bookings')
        .update({
          player_name: editPlayerName,
          player_phone: editPlayerPhone || null
        })
        .eq('id', editingBooking.id);

      if (error) throw error;

      console.log('Booking updated successfully');
      setIsEditDialogOpen(false);
      setEditingBooking(null);
      setEditPlayerName('');
      setEditPlayerPhone('');
      onBookingComplete();

    } catch (error) {
      console.error('Error updating booking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookTickets = async () => {
    if (!playerName.trim() || selectedTickets.length === 0) {
      return;
    }

    setIsSubmitting(true);
    console.log('Starting ticket booking process for:', selectedTickets);

    try {
      const bookingPromises = selectedTickets.map(async (ticketId) => {
        let realTicketId = ticketId;
        
        // If it's a temporary ID (negative), we need to create the ticket first
        if (ticketId < 0) {
          const ticketNumber = -ticketId;
          console.log('Creating ticket for number:', ticketNumber);
          
          // Check if this ticket number is already booked before creating
          if (bookedTicketNumbers.has(ticketNumber)) {
            throw new Error(`Ticket ${ticketNumber} is already booked`);
          }
          
          // Load the ticket data from selected ticket set
          const ticketData = await loadTicketFromSet(
            currentGame.ticket_set || 'set-1',
            ticketNumber,
            currentGame.max_tickets || 100
          );
          
          // Create the ticket in the database
          const { data: newTicket, error: ticketError } = await supabase
            .from('tickets')
            .insert(ticketData)
            .select()
            .single();
            
          if (ticketError) throw ticketError;
          realTicketId = newTicket.id;
          console.log('Created new ticket:', newTicket);
        } else {
          // For existing tickets, double-check they're not already booked
          if (bookedTicketIds.has(ticketId)) {
            const ticket = tickets.find(t => t.id === ticketId);
            throw new Error(`Ticket ${ticket?.ticket_number} is already booked`);
          }
        }
        
        // Create the booking
        console.log('Creating booking for ticket ID:', realTicketId);
        const bookingResult = await supabase
          .from('bookings')
          .insert({
            game_id: currentGame.id,
            ticket_id: realTicketId,
            player_name: playerName,
            player_phone: playerPhone || null
          })
          .select()
          .single();
          
        if (bookingResult.error) throw bookingResult.error;
        console.log('Created booking:', bookingResult.data);
        return bookingResult;
      });

      const results = await Promise.all(bookingPromises);
      
      // Check if any booking failed
      const failures = results.filter(result => result.error);
      if (failures.length > 0) {
        console.error('Booking failures:', failures);
        throw new Error('Some bookings failed');
      }

      console.log('All bookings completed successfully');
      
      // Reset form
      setSelectedTickets([]);
      setPlayerName('');
      setPlayerPhone('');
      setIsBookingDialogOpen(false);
      onBookingComplete();

    } catch (error) {
      console.error('Error booking tickets:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSelection = () => {
    setSelectedTickets([]);
  };

  const getTicketStatus = (ticketNumber: number) => {
    // Check if this ticket number is booked
    if (bookedTicketNumbers.has(ticketNumber)) {
      return 'booked';
    }
    
    const ticket = ticketMap.get(ticketNumber);
    if (!ticket) {
      // Check if it's selected as a temporary ticket
      const tempId = -ticketNumber;
      if (selectedTickets.includes(tempId)) return 'selected';
      return 'available'; // Available for creation
    }
    
    if (bookedTicketIds.has(ticket.id)) return 'booked';
    if (selectedTickets.includes(ticket.id)) return 'selected';
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
                      Selected tickets: {selectedTickets.map(ticketId => {
                        if (ticketId < 0) return -ticketId; // Temporary ticket
                        const ticket = tickets.find(t => t.id === ticketId);
                        return ticket?.ticket_number;
                      }).join(', ')}
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

        <div className="space-y-1">
          {ticketRows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-10 gap-1">
              {row.map(({ ticketNumber, ticket }) => {
                const status = getTicketStatus(ticketNumber);
                
                return (
                  <div
                    key={ticketNumber}
                    onClick={() => handleTicketClick(ticketNumber)}
                    className={`
                      aspect-square border rounded text-center text-xs transition-colors flex items-center justify-center
                      ${getTicketStyles(status)}
                    `}
                  >
                    <div className="font-medium">{ticketNumber}</div>
                  </div>
                );
              })}
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
          {sortedBookings.length > 0 ? (
            sortedBookings.map(booking => {
              const ticket = tickets.find(t => t.id === booking.ticket_id);
              return (
                <div key={booking.id} className="flex justify-between items-center p-3 bg-gray-100 rounded">
                  <div className="flex-1">
                    <span className="font-medium">Ticket {ticket?.ticket_number || booking.ticket_id}</span>
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
              );
            })
          ) : (
            <p className="text-gray-500">No bookings yet</p>
          )}
        </div>
      </Card>

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booking - Ticket {editingBooking && tickets.find(t => t.id === editingBooking.ticket_id)?.ticket_number}</DialogTitle>
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
