
-- Remove the unique constraint that prevents multiple winners per prize type per game
ALTER TABLE public.winners DROP CONSTRAINT IF EXISTS winners_game_id_prize_type_key;

-- Add a new unique constraint that allows multiple winners but prevents exact duplicates
-- This prevents the same ticket from winning the same prize multiple times
ALTER TABLE public.winners ADD CONSTRAINT winners_game_id_ticket_id_prize_type_key 
UNIQUE (game_id, ticket_id, prize_type);
