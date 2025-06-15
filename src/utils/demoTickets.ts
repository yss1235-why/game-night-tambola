
export const createDemoTickets = async () => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  // Check if demo tickets already exist
  const { data: existingTickets } = await supabase
    .from('tickets')
    .select('id')
    .limit(1);
    
  if (existingTickets && existingTickets.length > 0) {
    return; // Demo tickets already exist
  }

  const demoTickets = [
    {
      ticket_number: 1,
      numbers: [5, 12, 23, 34, 45, 56, 67, 78, 89],
      row1: [5, 12, 23],
      row2: [34, 45, 56],
      row3: [67, 78, 89]
    },
    {
      ticket_number: 2,
      numbers: [1, 15, 27, 38, 49, 52, 63, 74, 85],
      row1: [1, 15, 27],
      row2: [38, 49, 52],
      row3: [63, 74, 85]
    },
    {
      ticket_number: 3,
      numbers: [8, 19, 25, 31, 42, 58, 69, 71, 83],
      row1: [8, 19, 25],
      row2: [31, 42, 58],
      row3: [69, 71, 83]
    },
    {
      ticket_number: 4,
      numbers: [3, 14, 26, 37, 48, 54, 65, 76, 87],
      row1: [3, 14, 26],
      row2: [37, 48, 54],
      row3: [65, 76, 87]
    },
    {
      ticket_number: 5,
      numbers: [7, 18, 29, 35, 41, 59, 62, 73, 84],
      row1: [7, 18, 29],
      row2: [35, 41, 59],
      row3: [62, 73, 84]
    }
  ];

  try {
    const { error } = await supabase
      .from('tickets')
      .insert(demoTickets);
      
    if (error) {
      console.error('Error creating demo tickets:', error);
    } else {
      console.log('Demo tickets created successfully');
    }
  } catch (error) {
    console.error('Error creating demo tickets:', error);
  }
};
