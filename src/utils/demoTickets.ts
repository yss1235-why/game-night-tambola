
import { supabase } from '@/integrations/supabase/client';
import { generateHousieTicket } from './ticketGenerator';

export const createDemoTickets = async () => {
  console.log('Checking for existing tickets...');
  
  // Check if tickets already exist
  const { data: existingTickets, error: checkError } = await supabase
    .from('tickets')
    .select('id')
    .limit(1);
    
  if (checkError) {
    console.error('Error checking existing tickets:', checkError);
    return;
  }
  
  if (existingTickets && existingTickets.length > 0) {
    console.log('Demo tickets already exist, skipping creation');
    return;
  }
  
  console.log('Creating demo tickets with proper 15-number format...');
  
  try {
    // Generate 5 demo tickets with proper 15-number format
    const demoTickets = [];
    for (let i = 1; i <= 5; i++) {
      demoTickets.push(generateHousieTicket(i));
    }
    
    const { error } = await supabase
      .from('tickets')
      .insert(demoTickets);
      
    if (error) {
      console.error('Error creating demo tickets:', error);
    } else {
      console.log('Demo tickets created successfully');
    }
  } catch (error) {
    console.error('Error in createDemoTickets:', error);
  }
};
