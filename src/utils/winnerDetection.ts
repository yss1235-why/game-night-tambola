
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
 * Get the winning number for a specific pattern - the last number that completed the pattern
 */
const getWinningNumber = (ticket: Ticket, prizeType: PrizeType, calledNumbers: number[]): number | null => {
  let requiredNumbers: number[] = [];
  
  switch (prizeType) {
    case 'quick_five':
      // For Quick 5, get the first 5 numbers that were called
      requiredNumbers = ticket.numbers.filter(num => calledNumbers.includes(num)).slice(0, 5);
      break;
    case 'corners':
      requiredNumbers = [ticket.row1[0], ticket.row1[4], ticket.row3[0], ticket.row3[4]];
      break;
    case 'star_corners':
      requiredNumbers = [ticket.row1[0], ticket.row1[4], ticket.row2[2], ticket.row3[0], ticket.row3[4]];
      break;
    case 'top_line':
      requiredNumbers = ticket.row1;
      break;
    case 'middle_line':
      requiredNumbers = ticket.row2;
      break;
    case 'bottom_line':
      requiredNumbers = ticket.row3;
      break;
    case 'full_house':
    case 'second_full_house':
      requiredNumbers = ticket.numbers;
      break;
    default:
      return null;
  }
  
  // Find the last called number that was needed to complete this pattern
  const requiredCallIndices = requiredNumbers.map(num => calledNumbers.indexOf(num));
  const lastRequiredIndex = Math.max(...requiredCallIndices);
  
  return lastRequiredIndex >= 0 ? calledNumbers[lastRequiredIndex] : null;
};

/**
 * Prize types that should only have one winner per game (for sheet patterns)
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

  // Get existing winners organized by prize type and ticket
  const existingWinnersByPrizeAndTicket = new Set<string>();
  existingWinners.forEach(winner => {
    existingWinnersByPrizeAndTicket.add(`${winner.prize_type}-${winner.ticket_id}`);
  });

  // Get existing winner ticket IDs for sheet prizes (these should still be unique)
  const existingSheetWinners = new Set<string>();
  existingWinners.forEach(winner => {
    if (SINGLE_WINNER_PRIZES.includes(winner.prize_type)) {
      existingSheetWinners.add(winner.prize_type);
    }
  });

  // Group potential winners by prize type and winning number
  const potentialWinnersByPrizeAndNumber = new Map<string, WinnerDetectionResult[]>();

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
      
      // Skip if this ticket already won this prize
      if (existingWinnersByPrizeAndTicket.has(winnerKey)) return;
      
      if (checkFn()) {
        const winningNumber = getWinningNumber(ticket, prizeType, calledNumbers);
        if (winningNumber !== null) {
          const groupKey = `${prizeType}-${winningNumber}`;
          
          if (!potentialWinnersByPrizeAndNumber.has(groupKey)) {
            potentialWinnersByPrizeAndNumber.set(groupKey, []);
          }
          
          potentialWinnersByPrizeAndNumber.get(groupKey)!.push({
            prizeType,
            ticketId: ticket.id,
            ticketNumber: ticket.ticket_number,
            playerName: booking.player_name,
            playerPhone: booking.player_phone || undefined
          });
        }
      }
    });
  });

  // Add all winners who completed patterns on the same number
  potentialWinnersByPrizeAndNumber.forEach((groupWinners, groupKey) => {
    console.log(`Winners for ${groupKey}:`, groupWinners.map(w => w.ticketNumber));
    winners.push(...groupWinners);
  });

  // Check sheet patterns (Half Sheet and Full Sheet) - these remain single winners
  if (!existingSheetWinners.has('half_sheet')) {
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

  if (!existingSheetWinners.has('full_sheet')) {
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
  const fullHouseWinners = existingWinners.filter(w => w.prize_type === 'full_house');
  if (fullHouseWinners.length > 0) {
    const existingSecondFullHouseWinners = existingWinners.filter(w => w.prize_type === 'second_full_house');
    const potentialSecondFullHouseWinners = new Map<number, WinnerDetectionResult[]>();
    
    // Check for second full house (exclude existing full house and second full house winners)
    tickets.forEach(ticket => {
      const booking = ticketToBooking.get(ticket.id);
      if (!booking) return;

      const isAlreadyFullHouseWinner = fullHouseWinners.some(w => w.ticket_id === ticket.id);
      const isAlreadySecondFullHouseWinner = existingSecondFullHouseWinners.some(w => w.ticket_id === ticket.id);
      
      if (!isAlreadyFullHouseWinner && 
          !isAlreadySecondFullHouseWinner && 
          checkFullHouse(ticket, calledNumbers)) {
        
        const winningNumber = getWinningNumber(ticket, 'second_full_house', calledNumbers);
        if (winningNumber !== null) {
          if (!potentialSecondFullHouseWinners.has(winningNumber)) {
            potentialSecondFullHouseWinners.set(winningNumber, []);
          }
          
          potentialSecondFullHouseWinners.get(winningNumber)!.push({
            prizeType: 'second_full_house',
            ticketId: ticket.id,
            ticketNumber: ticket.ticket_number,
            playerName: booking.player_name,
            playerPhone: booking.player_phone || undefined
          });
        }
      }
    });

    // Add all second full house winners who completed on the same number
    potentialSecondFullHouseWinners.forEach((groupWinners, winningNumber) => {
      console.log(`Second full house winners for number ${winningNumber}:`, groupWinners.map(w => w.ticketNumber));
      winners.push(...groupWinners);
    });
  }

  console.log(`Total new winners detected: ${winners.length}`);
  return winners;
};
