
-- First, clear all existing bookings to avoid foreign key constraint violations
DELETE FROM public.bookings;

-- Then clear all existing tickets
DELETE FROM public.tickets;

-- Now update the table structure to support 5 numbers per row (15 total)
-- Update the numbers array to hold exactly 15 numbers
ALTER TABLE public.tickets 
ALTER COLUMN numbers TYPE INTEGER[15];

-- Update row arrays to hold exactly 5 numbers each
ALTER TABLE public.tickets 
ALTER COLUMN row1 TYPE INTEGER[5];

ALTER TABLE public.tickets 
ALTER COLUMN row2 TYPE INTEGER[5];

ALTER TABLE public.tickets 
ALTER COLUMN row3 TYPE INTEGER[5];

-- Add constraints to ensure proper array lengths
ALTER TABLE public.tickets 
ADD CONSTRAINT tickets_numbers_length CHECK (array_length(numbers, 1) = 15);

ALTER TABLE public.tickets 
ADD CONSTRAINT tickets_row1_length CHECK (array_length(row1, 1) = 5);

ALTER TABLE public.tickets 
ADD CONSTRAINT tickets_row2_length CHECK (array_length(row2, 1) = 5);

ALTER TABLE public.tickets 
ADD CONSTRAINT tickets_row3_length CHECK (array_length(row3, 1) = 5);

-- Add new prize types for half_sheet and full_sheet
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'half_sheet' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'prize_type')) THEN
        ALTER TYPE prize_type ADD VALUE 'half_sheet';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'full_sheet' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'prize_type')) THEN
        ALTER TYPE prize_type ADD VALUE 'full_sheet';
    END IF;
END $$;
