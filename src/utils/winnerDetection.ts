
import { Booking, Ticket, PrizeType } from '@/types/game';
import { getWinningHalfSheet, getWinningFullSheet } from './sheetValidation';

export interface WinnerDetectionResult {
  prizeType: PrizeType;
  ticketId: number;
  ticketNumber: number;
  playerName: string;
  playerPhone?: string;
}

/**
 * Check if a ticket has Quick 5 (any 5 numbers marked)
 */
export const checkQuickFive = (ticket: Ticket, calledNumbers: number[]): boolean => {
  const markedCount = ticket.numbers.filter(num => calledNumbers.includes(num)).length;
  return markedCount >= 5;
};

/**
 * Check if a ticket has Four Corners (all 4 corner numbers marked)
 */
export const checkCorners = (ticket: Ticket, calledNumbers: number[]): boolean => {
  // Corners are first and last numbers of first and third rows
  const corners = [
    ticket.row1[0], ticket.row1[4], // Top row corners
    ticket.row3[0], ticket.row3[4]  // Bottom row corners
  ];
  
  return corners.every(num => calledNumbers.includes(num));
};

/**
 * Check if a ticket has Star Corners (center + 4 corners)
 */
export const checkStarCorners = (ticket: Ticket, calledNumbers: number[]): boolean => {
  // Star corners: 4 corners + center number (middle of middle row)
  const starNumbers = [
    ticket.row1[0], ticket.row1[4], // Top row corners
    ticket.row2[2],                 // Center number
    ticket.row3[0], ticket.row3[4]  // Bottom row corners
  ];
  
  return starNumbers.every(num => calledNumbers.includes(num));
};

/**
 * Check if a ticket has a complete line
 */
export const checkLine = (row: number[], calledNumbers: number[]): boolean => {
  return row.every(num => calledNumbers.includes(num));
};

/**
 * Check if a ticket has Top Line
 */
export const checkTopLine = (ticket: Ticket, calledNumbers: number[]): boolean => {
  return checkLine(ticket.row1, calledNumbers);
};

/**
 * Check if a ticket has Middle Line
 */
export const checkMiddleLine = (ticket: Ticket, calledNumbers: number[]): boolean => {
  return checkLine(ticket.row2, calledNumbers);
};

/**
 * Check if a ticket has Bottom Line
 */
export const checkBottomLine = (ticket: Ticket, calledNumbers: number[]): boolean => {
  return checkLine(ticket.row3, calledNumbers);
};

/**
 * Check if a ticket has Full House (all numbers marked)
 */
export const checkFullHouse = (ticket: Ticket, calledNumbers: number[]): boolean => {
  return ticket.numbers.every(num => calledNumbers.includes(num));
};

/**
 * Prize types that should only have one winner per game
 */
const SINGLE_WINNER_PRIZES = ['half_sheet', 'full_sheet'];

/**
 * Detect all winners for the current game state
 */
export const detectWinners = (
  tickets: Ticket[],
  bookings: Booking[],
  calledNumbers: number[],
  existingWinners: { prize_type: string; ticket_id: number }[],
  maxTickets: number
): WinnerDetectionResult[] => {
  const winners: WinnerDetectionResult[] = [];
  
  // Create a map of ticket ID to booking for quick lookup
  const ticketToBooking = new Map<number, Booking>();
  bookings.forEach(booking => {
    ticketToBooking.set(booking.ticket_id, booking);
  });

  // Get existing winners organized by prize type
  const existingWinnersByPrize = new Map<string, { prize_type: string; ticket_id: number }[]>();
  existingWinners.forEach(winner => {
    const existing = existingWinnersByPrize.get(winner.prize_type) || [];
    existing.push(winner);
    existingWinnersByPrize.set(winner.prize_type, existing);
  });

  // Get existing winner ticket IDs for specific prize type
  const getExistingWinnerTicketIds = (prizeType: string): Set<number> => {
    const existing = existingWinnersByPrize.get(prizeType) || [];
    return new Set(existing.map(w => w.ticket_id));
  };

  // Check if a prize type already has a winner (for single-winner prizes)
  const hasSingleWinnerAlready = (prizeType: string): boolean => {
    if (!SINGLE_WINNER_PRIZES.includes(prizeType)) return false;
    return existingWinnersByPrize.has(prizeType);
  };

  // Check individual ticket patterns
  tickets.forEach(ticket => {
    const booking = ticketToBooking.get(ticket.id);
    if (!booking) return; // Skip unbooked tickets

    const checks: { prizeType: PrizeType; checkFn: () => boolean }[] = [
      { prizeType: 'quick_five', checkFn: () => checkQuickFive(ticket, calledNumbers) },
      { prizeType: 'corners', checkFn: () => checkCorners(ticket, calledNumbers) },
      { prizeType: 'star_corners', checkFn: () => checkStarCorners(ticket, calledNumbers) },
      { prizeType: 'top_line', checkFn: () => checkTopLine(ticket, calledNumbers) },
      { prizeType: 'middle_line', checkFn: () => checkMiddleLine(ticket, calledNumbers) },
      { prizeType: 'bottom_line', checkFn: () => checkBottomLine(ticket, calledNumbers) },
      { prizeType: 'full_house', checkFn: () => checkFullHouse(ticket, calledNumbers) },
    ];

    checks.forEach(({ prizeType, checkFn }) => {
      const existingTicketIds = getExistingWinnerTicketIds(prizeType);
      
      // Skip if this ticket already won this prize
      if (existingTicketIds.has(ticket.id)) return;
      
      // For single-winner prizes, skip if someone already won
      if (hasSingleWinnerAlready(prizeType)) return;
      
      if (checkFn()) {
        console.log(`Winner detected: ${prizeType} for ticket ${ticket.ticket_number}`);
        winners.push({
          prizeType,
          ticketId: ticket.id,
          ticketNumber: ticket.ticket_number,
          playerName: booking.player_name,
          playerPhone: booking.player_phone || undefined
        });
      }
    });
  });

  // Check sheet patterns (Half Sheet and Full Sheet) - only if not already won
  if (!hasSingleWinnerAlready('half_sheet')) {
    const halfSheetWinner = getWinningHalfSheet(bookings, tickets, calledNumbers, maxTickets);
    if (halfSheetWinner) {
      const firstTicket = tickets.find(t => t.ticket_number === halfSheetWinner.tickets[0]);
      if (firstTicket) {
        console.log(`Half sheet winner detected: ${halfSheetWinner.playerName} with tickets ${halfSheetWinner.tickets.join(', ')}`);
        winners.push({
          prizeType: 'half_sheet',
          ticketId: firstTicket.id,
          ticketNumber: firstTicket.ticket_number,
          playerName: halfSheetWinner.playerName,
          playerPhone: undefined
        });
      }
    }
  }

  if (!hasSingleWinnerAlready('full_sheet')) {
    const fullSheetWinner = getWinningFullSheet(bookings, tickets, calledNumbers, maxTickets);
    if (fullSheetWinner) {
      const firstTicket = tickets.find(t => t.ticket_number === fullSheetWinner.tickets[0]);
      if (firstTicket) {
        console.log(`Full sheet winner detected: ${fullSheetWinner.playerName} with tickets ${fullSheetWinner.tickets.join(', ')}`);
        winners.push({
          prizeType: 'full_sheet',
          ticketId: firstTicket.id,
          ticketNumber: firstTicket.ticket_number,
          playerName: fullSheetWinner.playerName,
          playerPhone: undefined
        });
      }
    }
  }

  // Handle second full house - check if there are already full house winners
  const fullHouseWinners = existingWinnersByPrize.get('full_house') || [];
  if (fullHouseWinners.length > 0) {
    const existingSecondFullHouseWinners = existingWinnersByPrize.get('second_full_house') || [];
    
    // Check for second full house (exclude existing full house and second full house winners)
    tickets.forEach(ticket => {
      const booking = ticketToBooking.get(ticket.id);
      if (!booking) return;

      const isAlreadyFullHouseWinner = fullHouseWinners.some(w => w.ticket_id === ticket.id);
      const isAlreadySecondFullHouseWinner = existingSecondFullHouseWinners.some(w => w.ticket_id === ticket.id);
      
      if (!isAlreadyFullHouseWinner && 
          !isAlreadySecondFullHouseWinner && 
          checkFullHouse(ticket, calledNumbers)) {
        console.log(`Second full house winner detected: ticket ${ticket.ticket_number}`);
        winners.push({
          prizeType: 'second_full_house',
          ticketId: ticket.id,
          ticketNumber: ticket.ticket_number,
          playerName: booking.player_name,
          playerPhone: booking.player_phone || undefined
        });
      }
    });
  }

  console.log(`Total new winners detected: ${winners.length}`);
  return winners;
};
