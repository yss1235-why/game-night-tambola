
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

  // Get existing winners to avoid duplicates
  const existingWinnerKeys = new Set(
    existingWinners.map(w => `${w.prize_type}-${w.ticket_id}`)
  );

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
      const winnerKey = `${prizeType}-${ticket.id}`;
      if (!existingWinnerKeys.has(winnerKey) && checkFn()) {
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

  // Check sheet patterns (Half Sheet and Full Sheet)
  const halfSheetWinner = getWinningHalfSheet(bookings, tickets, calledNumbers, maxTickets);
  if (halfSheetWinner) {
    // Use the first ticket in the half sheet as the winner record
    const firstTicket = tickets.find(t => t.ticket_number === halfSheetWinner.tickets[0]);
    if (firstTicket) {
      const winnerKey = `half_sheet-${firstTicket.id}`;
      if (!existingWinnerKeys.has(winnerKey)) {
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

  const fullSheetWinner = getWinningFullSheet(bookings, tickets, calledNumbers, maxTickets);
  if (fullSheetWinner) {
    // Use the first ticket in the full sheet as the winner record
    const firstTicket = tickets.find(t => t.ticket_number === fullSheetWinner.tickets[0]);
    if (firstTicket) {
      const winnerKey = `full_sheet-${firstTicket.id}`;
      if (!existingWinnerKeys.has(winnerKey)) {
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
  const fullHouseWinners = existingWinners.filter(w => w.prize_type === 'full_house');
  if (fullHouseWinners.length > 0) {
    // Check for second full house (exclude existing full house winners)
    tickets.forEach(ticket => {
      const booking = ticketToBooking.get(ticket.id);
      if (!booking) return;

      const isAlreadyFullHouseWinner = fullHouseWinners.some(w => w.ticket_id === ticket.id);
      const winnerKey = `second_full_house-${ticket.id}`;
      
      if (!isAlreadyFullHouseWinner && 
          !existingWinnerKeys.has(winnerKey) && 
          checkFullHouse(ticket, calledNumbers)) {
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

  return winners;
};
