
import { Booking, Ticket, Game } from '@/types/game';

export interface SheetCandidate {
  tickets: number[];
  playerId: string;
  playerName: string;
  isValid: boolean;
  reason?: string;
}

/**
 * Find all potential half sheet candidates (3 consecutive tickets ending on multiples of 3)
 */
export const findHalfSheetCandidates = (
  bookings: Booking[],
  tickets: Ticket[],
  maxTickets: number
): SheetCandidate[] => {
  const candidates: SheetCandidate[] = [];
  
  // Create a map of ticket number to booking for quick lookup
  const ticketToBooking = new Map<number, Booking>();
  bookings.forEach(booking => {
    const ticket = tickets.find(t => t.id === booking.ticket_id);
    if (ticket) {
      ticketToBooking.set(ticket.ticket_number, booking);
    }
  });

  // Check each possible ending ticket (multiples of 3)
  for (let endTicket = 3; endTicket <= maxTickets; endTicket += 3) {
    const sheetTickets = [endTicket - 2, endTicket - 1, endTicket];
    
    // Skip if any ticket number would be invalid
    if (sheetTickets[0] < 1) continue;
    
    // Check if all 3 tickets are booked
    const bookingsForSheet = sheetTickets.map(ticketNum => ticketToBooking.get(ticketNum)).filter(Boolean);
    
    if (bookingsForSheet.length === 3) {
      // Check if all tickets belong to the same player
      const firstPlayerName = bookingsForSheet[0]!.player_name;
      const samePlayer = bookingsForSheet.every(booking => booking!.player_name === firstPlayerName);
      
      if (samePlayer) {
        candidates.push({
          tickets: sheetTickets,
          playerId: bookingsForSheet[0]!.id,
          playerName: firstPlayerName,
          isValid: true
        });
      } else {
        candidates.push({
          tickets: sheetTickets,
          playerId: '',
          playerName: 'Multiple players',
          isValid: false,
          reason: 'Tickets owned by different players'
        });
      }
    }
  }
  
  return candidates;
};

/**
 * Find all potential full sheet candidates (6 consecutive tickets ending on multiples of 6)
 */
export const findFullSheetCandidates = (
  bookings: Booking[],
  tickets: Ticket[],
  maxTickets: number
): SheetCandidate[] => {
  const candidates: SheetCandidate[] = [];
  
  // Create a map of ticket number to booking for quick lookup
  const ticketToBooking = new Map<number, Booking>();
  bookings.forEach(booking => {
    const ticket = tickets.find(t => t.id === booking.ticket_id);
    if (ticket) {
      ticketToBooking.set(ticket.ticket_number, booking);
    }
  });

  // Check each possible ending ticket (multiples of 6)
  for (let endTicket = 6; endTicket <= maxTickets; endTicket += 6) {
    const sheetTickets = [
      endTicket - 5, endTicket - 4, endTicket - 3,
      endTicket - 2, endTicket - 1, endTicket
    ];
    
    // Skip if any ticket number would be invalid
    if (sheetTickets[0] < 1) continue;
    
    // Check if all 6 tickets are booked
    const bookingsForSheet = sheetTickets.map(ticketNum => ticketToBooking.get(ticketNum)).filter(Boolean);
    
    if (bookingsForSheet.length === 6) {
      // Check if all tickets belong to the same player
      const firstPlayerName = bookingsForSheet[0]!.player_name;
      const samePlayer = bookingsForSheet.every(booking => booking!.player_name === firstPlayerName);
      
      if (samePlayer) {
        candidates.push({
          tickets: sheetTickets,
          playerId: bookingsForSheet[0]!.id,
          playerName: firstPlayerName,
          isValid: true
        });
      } else {
        candidates.push({
          tickets: sheetTickets,
          playerId: '',
          playerName: 'Multiple players',
          isValid: false,
          reason: 'Tickets owned by different players'
        });
      }
    }
  }
  
  return candidates;
};

/**
 * Check if a ticket has at least the minimum required marked numbers
 */
export const hasMinimumMarkedNumbers = (
  ticket: Ticket,
  calledNumbers: number[],
  minimumRequired: number = 2
): boolean => {
  const markedCount = ticket.numbers.filter(num => calledNumbers.includes(num)).length;
  return markedCount >= minimumRequired;
};

/**
 * Validate a sheet candidate for winning conditions
 */
export const validateSheetForWinning = (
  candidate: SheetCandidate,
  tickets: Ticket[],
  calledNumbers: number[]
): { isWinner: boolean; reason?: string } => {
  if (!candidate.isValid) {
    return { isWinner: false, reason: candidate.reason };
  }
  
  // Check each ticket in the sheet has minimum marked numbers
  for (const ticketNumber of candidate.tickets) {
    const ticket = tickets.find(t => t.ticket_number === ticketNumber);
    if (!ticket) {
      return { isWinner: false, reason: `Ticket ${ticketNumber} not found` };
    }
    
    if (!hasMinimumMarkedNumbers(ticket, calledNumbers, 2)) {
      return { isWinner: false, reason: `Ticket ${ticketNumber} has less than 2 marked numbers` };
    }
  }
  
  return { isWinner: true };
};

/**
 * Get the first valid winning half sheet
 */
export const getWinningHalfSheet = (
  bookings: Booking[],
  tickets: Ticket[],
  calledNumbers: number[],
  maxTickets: number
): SheetCandidate | null => {
  const candidates = findHalfSheetCandidates(bookings, tickets, maxTickets);
  
  for (const candidate of candidates) {
    const validation = validateSheetForWinning(candidate, tickets, calledNumbers);
    if (validation.isWinner) {
      return candidate;
    }
  }
  
  return null;
};

/**
 * Get the first valid winning full sheet
 */
export const getWinningFullSheet = (
  bookings: Booking[],
  tickets: Ticket[],
  calledNumbers: number[],
  maxTickets: number
): SheetCandidate | null => {
  const candidates = findFullSheetCandidates(bookings, tickets, maxTickets);
  
  for (const candidate of candidates) {
    const validation = validateSheetForWinning(candidate, tickets, calledNumbers);
    if (validation.isWinner) {
      return candidate;
    }
  }
  
  return null;
};
