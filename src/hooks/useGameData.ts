
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Game, Ticket, Booking, Winner } from '@/types/game';
import { createDemoTickets } from '@/utils/demoTickets';

export const useGameData = () => {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [lastGameWinners, setLastGameWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeData();
    
    // Setup realtime subscriptions
    const gamesChannel = supabase
      .channel('games-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games'
      }, (payload) => {
        console.log('Games change:', payload);
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const updatedGame = payload.new as Game;
          console.log('Updating current game in real-time:', updatedGame);
          setCurrentGame(updatedGame);
          
          // When max_tickets changes, we need to refresh bookings to ensure UI consistency
          if (payload.eventType === 'UPDATE' && payload.old && 
              (payload.old as Game).max_tickets !== updatedGame.max_tickets) {
            fetchBookingsForGame(updatedGame.id);
          }
        }
      })
      .subscribe();

    const ticketsChannel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tickets'
      }, (payload) => {
        console.log('Tickets change:', payload);
        if (payload.eventType === 'INSERT') {
          const newTicket = payload.new as Ticket;
          console.log('Adding new ticket:', newTicket);
          setTickets(prev => {
            // Check if ticket already exists to avoid duplicates
            const exists = prev.some(t => t.id === newTicket.id);
            if (exists) return prev;
            return [...prev, newTicket];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedTicket = payload.new as Ticket;
          console.log('Updating ticket:', updatedTicket);
          setTickets(prev => prev.map(ticket => 
            ticket.id === updatedTicket.id ? updatedTicket : ticket
          ));
        }
      })
      .subscribe();

    const bookingsChannel = supabase
      .channel('bookings-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, (payload) => {
        console.log('Bookings change:', payload);
        if (payload.eventType === 'INSERT') {
          const newBooking = payload.new as Booking;
          console.log('Adding new booking:', newBooking);
          setBookings(prev => {
            // Check if booking already exists to avoid duplicates
            const exists = prev.some(b => b.id === newBooking.id);
            if (exists) return prev;
            return [...prev, newBooking];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedBooking = payload.new as Booking;
          console.log('Updating booking:', updatedBooking);
          setBookings(prev => prev.map(booking => 
            booking.id === updatedBooking.id ? updatedBooking : booking
          ));
        } else if (payload.eventType === 'DELETE') {
          const deletedBooking = payload.old as Booking;
          console.log('Deleting booking:', deletedBooking);
          setBookings(prev => prev.filter(booking => booking.id !== deletedBooking.id));
        }
      })
      .subscribe();

    const winnersChannel = supabase
      .channel('winners-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'winners'
      }, (payload) => {
        console.log('Winners change:', payload);
        if (payload.eventType === 'INSERT') {
          const newWinner = payload.new as Winner;
          console.log('Adding new winner:', newWinner);
          setWinners(prev => {
            // Check if winner already exists to avoid duplicates
            const exists = prev.some(w => w.id === newWinner.id);
            if (exists) return prev;
            return [...prev, newWinner];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedWinner = payload.new as Winner;
          console.log('Updating winner:', updatedWinner);
          setWinners(prev => prev.map(winner => 
            winner.id === updatedWinner.id ? updatedWinner : winner
          ));
        } else if (payload.eventType === 'DELETE') {
          const deletedWinner = payload.old as Winner;
          console.log('Deleting winner:', deletedWinner);
          setWinners(prev => prev.filter(winner => winner.id !== deletedWinner.id));
        }
      })
      .subscribe();

    // Cleanup function
    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(gamesChannel);
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(winnersChannel);
    };
  }, []);

  const fetchBookingsForGame = async (gameId: string) => {
    try {
      console.log('Fetching bookings for game:', gameId);
      const { data: gameBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('game_id', gameId);
      console.log('Fetched bookings:', gameBookings);
      setBookings(gameBookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const initializeData = async () => {
    // Create demo tickets first
    await createDemoTickets();
    
    // Then fetch all data
    await fetchInitialData();
  };

  const fetchInitialData = async () => {
    try {
      // Get current active game or latest game
      const { data: games } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (games && games.length > 0) {
        const game = games[0];
        console.log('Setting initial current game:', game);
        setCurrentGame(game);

        if (game.status === 'ended') {
          // If game is ended, fetch winners for last game display
          const { data: lastWinners } = await supabase
            .from('winners')
            .select('*')
            .eq('game_id', game.id);
          setLastGameWinners(lastWinners || []);
        }

        // Fetch bookings for current game
        await fetchBookingsForGame(game.id);

        // Fetch winners for current game
        const { data: gameWinners } = await supabase
          .from('winners')
          .select('*')
          .eq('game_id', game.id);
        setWinners(gameWinners || []);
      }

      // Fetch all tickets
      const { data: allTickets } = await supabase
        .from('tickets')
        .select('*')
        .order('ticket_number');
      setTickets(allTickets || []);

    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a manual refresh function for troubleshooting
  const refreshData = async () => {
    if (currentGame) {
      await fetchBookingsForGame(currentGame.id);
    }
  };

  return {
    currentGame,
    tickets,
    bookings,
    winners,
    lastGameWinners,
    isLoading,
    refreshData
  };
};
