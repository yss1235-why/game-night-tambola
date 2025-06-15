
-- Enable RLS on tickets table (if not already enabled)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert tickets
-- This is needed for the booking system to create tickets on demand
CREATE POLICY "Allow ticket creation for bookings" 
  ON public.tickets 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow anyone to read tickets
-- This is needed to display tickets in the grid
CREATE POLICY "Allow reading all tickets" 
  ON public.tickets 
  FOR SELECT 
  USING (true);

-- Create policy to allow updating tickets if needed
CREATE POLICY "Allow updating tickets" 
  ON public.tickets 
  FOR UPDATE 
  USING (true);
