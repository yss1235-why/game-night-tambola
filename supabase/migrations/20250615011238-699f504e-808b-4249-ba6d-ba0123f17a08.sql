
-- Add missing columns to the games table
ALTER TABLE public.games 
ADD COLUMN host_phone TEXT,
ADD COLUMN ticket_set TEXT,
ADD COLUMN selected_prizes TEXT[];
