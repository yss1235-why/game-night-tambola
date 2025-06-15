
-- Update any existing early_five records to quick_five
UPDATE winners SET prize_type = 'quick_five' WHERE prize_type = 'early_five';
UPDATE admin_winner_settings SET prize_type = 'quick_five' WHERE prize_type = 'early_five';

-- Update any games that have early_five in their selected_prizes array
UPDATE games 
SET selected_prizes = array_replace(selected_prizes, 'early_five', 'quick_five')
WHERE 'early_five' = ANY(selected_prizes);
