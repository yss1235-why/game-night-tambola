
-- Add max_tickets field to the games table
ALTER TABLE public.games 
ADD COLUMN max_tickets integer DEFAULT 100;

-- Update existing games to have a default max_tickets value
UPDATE public.games 
SET max_tickets = 100 
WHERE max_tickets IS NULL;
