
-- Update the prize_type enum to use the new naming convention
ALTER TYPE prize_type RENAME TO prize_type_old;

CREATE TYPE prize_type AS ENUM (
  'top_line',
  'middle_line', 
  'bottom_line',
  'full_house',
  'early_five',
  'corners',
  'half_sheet',
  'full_sheet'
);

-- Update existing data in winners table
ALTER TABLE winners ALTER COLUMN prize_type TYPE prize_type USING 
  CASE 
    WHEN prize_type::text = 'first_line' THEN 'top_line'::prize_type
    WHEN prize_type::text = 'second_line' THEN 'middle_line'::prize_type  
    WHEN prize_type::text = 'third_line' THEN 'bottom_line'::prize_type
    ELSE prize_type::text::prize_type
  END;

-- Update existing data in admin_winner_settings table
ALTER TABLE admin_winner_settings ALTER COLUMN prize_type TYPE prize_type USING 
  CASE 
    WHEN prize_type::text = 'first_line' THEN 'top_line'::prize_type
    WHEN prize_type::text = 'second_line' THEN 'middle_line'::prize_type
    WHEN prize_type::text = 'third_line' THEN 'bottom_line'::prize_type  
    ELSE prize_type::text::prize_type
  END;

-- Update existing selected_prizes arrays in games table
UPDATE games 
SET selected_prizes = array_replace(
  array_replace(
    array_replace(selected_prizes, 'first_line', 'top_line'),
    'second_line', 'middle_line'
  ),
  'third_line', 'bottom_line'
)
WHERE selected_prizes IS NOT NULL;

-- Drop the old type
DROP TYPE prize_type_old;
