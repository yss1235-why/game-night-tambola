
-- Enable Row Level Security and create tables for Tambola game

-- Create enum types for game status and prize types
CREATE TYPE game_status AS ENUM ('waiting', 'active', 'paused', 'ended');
CREATE TYPE prize_type AS ENUM ('first_line', 'second_line', 'third_line', 'full_house', 'early_five', 'corners');
CREATE TYPE user_role AS ENUM ('host', 'admin');

-- Create hosts table (for authentication)
CREATE TABLE public.hosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create games table (only one active game at a time)
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES public.hosts(id) NOT NULL,
  status game_status DEFAULT 'waiting',
  current_number INTEGER,
  numbers_called INTEGER[] DEFAULT '{}',
  number_calling_delay INTEGER DEFAULT 5, -- seconds between number calls
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tickets table (pre-generated set)
CREATE TABLE public.tickets (
  id SERIAL PRIMARY KEY,
  ticket_number INTEGER UNIQUE NOT NULL,
  numbers INTEGER[15] NOT NULL, -- 15 numbers for 3x9 grid (3 numbers per row)
  row1 INTEGER[3] NOT NULL,
  row2 INTEGER[3] NOT NULL,
  row3 INTEGER[3] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) NOT NULL,
  ticket_id INTEGER REFERENCES public.tickets(id) NOT NULL,
  player_name TEXT NOT NULL,
  player_phone TEXT,
  booked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, ticket_id)
);

-- Create winners table (admin sets these)
CREATE TABLE public.winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) NOT NULL,
  ticket_id INTEGER REFERENCES public.tickets(id) NOT NULL,
  prize_type prize_type NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, prize_type) -- Only one winner per prize per game
);

-- Create admin_winner_settings table (admin pre-sets winners)
CREATE TABLE public.admin_winner_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) NOT NULL,
  ticket_number INTEGER NOT NULL,
  prize_type prize_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, prize_type) -- Only one setting per prize per game
);

-- Enable Row Level Security
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_winner_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hosts table
CREATE POLICY "Hosts can view their own data" ON public.hosts
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Hosts can update their own data" ON public.hosts
  FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for games table (public read, host/admin write)
CREATE POLICY "Anyone can view games" ON public.games
  FOR SELECT USING (true);

CREATE POLICY "Hosts can manage their games" ON public.games
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hosts 
      WHERE hosts.id = games.host_id 
      AND hosts.id::text = auth.uid()::text
    )
  );

-- RLS Policies for tickets (public read)
CREATE POLICY "Anyone can view tickets" ON public.tickets
  FOR SELECT USING (true);

-- RLS Policies for bookings (public read, restricted write)
CREATE POLICY "Anyone can view bookings" ON public.bookings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

-- RLS Policies for winners (public read)
CREATE POLICY "Anyone can view winners" ON public.winners
  FOR SELECT USING (true);

CREATE POLICY "System can manage winners" ON public.winners
  FOR ALL USING (true);

-- RLS Policies for admin winner settings (admin only)
CREATE POLICY "Admin can manage winner settings" ON public.admin_winner_settings
  FOR ALL USING (true); -- Will implement proper admin check later

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.winners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_winner_settings;

-- Set replica identity for real-time updates
ALTER TABLE public.games REPLICA IDENTITY FULL;
ALTER TABLE public.tickets REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.winners REPLICA IDENTITY FULL;
ALTER TABLE public.admin_winner_settings REPLICA IDENTITY FULL;

-- Insert sample tickets (first 10 tickets for testing)
INSERT INTO public.tickets (ticket_number, numbers, row1, row2, row3) VALUES
(1, '{9,19,35,42,58,65,72,85,90,13,26,44,51,67,78}', '{9,19,35}', '{42,58,65}', '{72,85,90}'),
(2, '{5,12,28,41,56,62,73,84,89,15,24,38,47,59,76}', '{5,12,28}', '{41,56,62}', '{73,84,89}'),
(3, '{7,18,32,43,55,68,71,82,88,11,27,39,48,64,79}', '{7,18,32}', '{43,55,68}', '{71,82,88}'),
(4, '{3,16,31,45,54,63,74,81,87,14,25,36,49,57,77}', '{3,16,31}', '{45,54,63}', '{74,81,87}'),
(5, '{8,17,29,44,52,66,75,83,86,12,21,37,46,58,69}', '{8,17,29}', '{44,52,66}', '{75,83,86}');
