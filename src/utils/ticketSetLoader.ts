// src/utils/ticketSetLoader.ts

interface TicketSetRow {
  setId: number;
  ticketId: number;
  rowId: 1 | 2 | 3;
  numbers: number[];
}

// Cache for loaded ticket sets
const ticketSetCache = new Map<string, any[]>();

export const loadTicketFromSet = async (setId: string, ticketNumber: number, maxTickets: number = 100) => {
  try {
    const cacheKey = `${setId}-${maxTickets}`;
    
    // Check if we already have this set cached
    if (!ticketSetCache.has(cacheKey)) {
      console.log(`Loading ticket set: ${setId} with max tickets: ${maxTickets}`);
      
      // Load the JSON file
      const response = await fetch(`/ticket-sets/${setId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ticket set: ${setId}`);
      }
      
      const allTickets: TicketSetRow[] = await response.json();
      console.log(`Loaded ${allTickets.length} ticket rows from ${setId}.json`);
      
      // Group tickets by ticketId and filter by maxTickets
      const ticketGroups = new Map<number, TicketSetRow[]>();
      
      allTickets.forEach(row => {
        if (row.ticketId <= maxTickets) {
          if (!ticketGroups.has(row.ticketId)) {
            ticketGroups.set(row.ticketId, []);
          }
          ticketGroups.get(row.ticketId)!.push(row);
        }
      });
      
      // Convert to database format
      const processedTickets: any[] = [];
      
      ticketGroups.forEach((rows, ticketId) => {
        // Sort rows by rowId
        rows.sort((a, b) => a.rowId - b.rowId);
        
        if (rows.length === 3) {
          const grid = rows.map(row => row.numbers);
          const allNumbers = grid.flat().filter(num => num !== 0).sort((a, b) => a - b);
          const row1 = grid[0].filter(num => num !== 0);
          const row2 = grid[1].filter(num => num !== 0);
          const row3 = grid[2].filter(num => num !== 0);
          
          processedTickets.push({
            ticket_number: ticketId,
            numbers: allNumbers,
            row1,
            row2,
            row3
          });
        }
      });
      
      // Cache the processed tickets
      ticketSetCache.set(cacheKey, processedTickets);
      console.log(`Cached ${processedTickets.length} tickets for ${cacheKey}`);
    }
    
    // Get ticket from cache
    const cachedTickets = ticketSetCache.get(cacheKey)!;
    const ticket = cachedTickets.find(t => t.ticket_number === ticketNumber);
    
    if (!ticket) {
      throw new Error(`Ticket ${ticketNumber} not found in ${setId} (max: ${maxTickets})`);
    }
    
    return ticket;
    
  } catch (error) {
    console.error('Error loading ticket from set:', error);
    throw error;
  }
};

// Optional: Clear cache function
export const clearTicketSetCache = () => {
  ticketSetCache.clear();
  console.log('Ticket set cache cleared');
};
