
-- First, add the new enum values
ALTER TYPE prize_type ADD VALUE IF NOT EXISTS 'quick_five';
ALTER TYPE prize_type ADD VALUE IF NOT EXISTS 'star_corners';
ALTER TYPE prize_type ADD VALUE IF NOT EXISTS 'second_full_house';
