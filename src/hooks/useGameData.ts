
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Game, Ticket, Booking, Winner } from '@/types/game';

export const useGameData = () => {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [lastGameWinners, setLastGameWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
    
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
          setCurrentGame(payload.new as Game);
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
          setBookings(prev => [...prev, payload.new as Booking]);
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
          setWinners(prev => [...prev, payload.new as Winner]);
        }
      })
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(gamesChannel);
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(winnersChannel);
    };
  }, []);

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
        const { data: gameBookings } = await supabase
          .from('bookings')
          .select('*')
          .eq('game_id', game.id);
        setBookings(gameBookings || []);

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

  return {
    currentGame,
    tickets,
    bookings,
    winners,
    lastGameWinners,
    isLoading
  };
};
