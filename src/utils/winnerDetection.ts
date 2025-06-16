
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
 * Detect all winners for the current game state
 */
export const detectWinners = (
  tickets: Ticket[],
  bookings: Booking[],
  calledNumbers: number[],
  existingWinners: { prize_type: string; ticket_id: number }[],
  maxTickets: number,
  selectedPrizes: string[] = [] // Changed to string[] to match database type
): WinnerDetectionResult[] => {
  const winners: WinnerDetectionResult[] = [];
  
  // Convert selectedPrizes strings to PrizeType for type safety, filtering out invalid ones
  const validPrizeTypes: PrizeType[] = ['quick_five', 'corners', 'star_corners', 'top_line', 'middle_line', 'bottom_line', 'half_sheet', 'full_sheet', 'full_house', 'second_full_house'];
  const selectedPrizeTypes = selectedPrizes.filter((prize): prize is PrizeType => 
    validPrizeTypes.includes(prize as PrizeType)
  );
  
  // Create a map of ticket ID to booking for quick lookup
  const ticketToBooking = new Map<number, Booking>();
  bookings.forEach(booking => {
    ticketToBooking.set(booking.ticket_id, booking);
  });

  // Create a set for faster lookup of existing winners
  const existingWinnerKeys = new Set<string>();
  existingWinners.forEach(winner => {
    const key = `${winner.prize_type}-${winner.ticket_id}`;
    existingWinnerKeys.add(key);
  });

  // Get existing winners organized by prize type
  const existingWinnersByPrize = new Map<string, { prize_type: string; ticket_id: number }[]>();
  existingWinners.forEach(winner => {
    if (!existingWinnersByPrize.has(winner.prize_type)) {
      existingWinnersByPrize.set(winner.prize_type, []);
    }
    existingWinnersByPrize.get(winner.prize_type)!.push(winner);
  });

  // Helper function to check if a winner already exists
  const isExistingWinner = (prizeType: string, ticketId: number): boolean => {
    const key = `${prizeType}-${ticketId}`;
    return existingWinnerKeys.has(key);
  };

  // Regular prize types (not sheets) - only check selected prizes
  const allRegularPrizeTypes: { prizeType: PrizeType; checkFn: (ticket: Ticket, calledNumbers: number[]) => boolean }[] = [
    { prizeType: 'quick_five', checkFn: checkQuickFive },
    { prizeType: 'corners', checkFn: checkCorners },
    { prizeType: 'star_corners', checkFn: checkStarCorners },
    { prizeType: 'top_line', checkFn: checkTopLine },
    { prizeType: 'middle_line', checkFn: checkMiddleLine },
    { prizeType: 'bottom_line', checkFn: checkBottomLine },
    { prizeType: 'full_house', checkFn: checkFullHouse },
  ];
  
  // Filter by selected prizes with proper typing
  const regularPrizeTypes = allRegularPrizeTypes.filter(({ prizeType }) => 
    selectedPrizeTypes.includes(prizeType)
  );

  // Check regular prize types
  regularPrizeTypes.forEach(({ prizeType, checkFn }) => {
    const existingPrizeWinners = existingWinnersByPrize.get(prizeType) || [];
    
    // Skip if this prize type already has winners
    if (existingPrizeWinners.length > 0) {
      console.log(`Skipping ${prizeType} - already has ${existingPrizeWinners.length} winner(s)`);
      return;
    }

    // Find all tickets that complete this pattern and group by winning number
    const potentialWinnersByNumber = new Map<number, WinnerDetectionResult[]>();
    
    tickets.forEach(ticket => {
      const booking = ticketToBooking.get(ticket.id);
      if (!booking) return; // Skip unbooked tickets

      // Skip if this ticket is already a winner for this prize type
      if (isExistingWinner(prizeType, ticket.id)) {
        return;
      }

      if (checkFn(ticket, calledNumbers)) {
        const winningNumber = getWinningNumber(ticket, prizeType, calledNumbers);
        if (winningNumber !== null) {
          if (!potentialWinnersByNumber.has(winningNumber)) {
            potentialWinnersByNumber.set(winningNumber, []);
          }
          
          potentialWinnersByNumber.get(winningNumber)!.push({
            prizeType,
            ticketId: ticket.id,
            ticketNumber: ticket.ticket_number,
            playerName: booking.player_name,
            playerPhone: booking.player_phone || undefined
          });
        }
      }
    });

    // If we have potential winners, find the group that completed first (earliest winning number in call sequence)
    if (potentialWinnersByNumber.size > 0) {
      let earliestWinningNumber = -1;
      let earliestIndex = calledNumbers.length;
      
      potentialWinnersByNumber.forEach((groupWinners, winningNumber) => {
        const numberIndex = calledNumbers.indexOf(winningNumber);
        if (numberIndex < earliestIndex) {
          earliestIndex = numberIndex;
          earliestWinningNumber = winningNumber;
        }
      });
      
      if (earliestWinningNumber !== -1) {
        const winningGroup = potentialWinnersByNumber.get(earliestWinningNumber)!;
        console.log(`${prizeType} winners (completed on number ${earliestWinningNumber}):`, winningGroup.map(w => w.ticketNumber));
        winners.push(...winningGroup);
      }
    }
  });

  // Check sheet patterns (Half Sheet and Full Sheet) - only if selected
  if (selectedPrizeTypes.includes('half_sheet') && !existingWinnersByPrize.has('half_sheet')) {
    const halfSheetWinner = getWinningHalfSheet(bookings, tickets, calledNumbers, maxTickets);
    if (halfSheetWinner) {
      const firstTicket = tickets.find(t => t.ticket_number === halfSheetWinner.tickets[0]);
      if (firstTicket && !isExistingWinner('half_sheet', firstTicket.id)) {
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

  if (selectedPrizeTypes.includes('full_sheet') && !existingWinnersByPrize.has('full_sheet')) {
    const fullSheetWinner = getWinningFullSheet(bookings, tickets, calledNumbers, maxTickets);
    if (fullSheetWinner) {
      const firstTicket = tickets.find(t => t.ticket_number === fullSheetWinner.tickets[0]);
      if (firstTicket && !isExistingWinner('full_sheet', firstTicket.id)) {
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

  // Handle second full house - check if there are already full house winners and if it's selected
  const fullHouseWinners = existingWinnersByPrize.get('full_house') || [];
  const existingSecondFullHouseWinners = existingWinnersByPrize.get('second_full_house') || [];
  
  if (selectedPrizeTypes.includes('second_full_house') && fullHouseWinners.length > 0 && existingSecondFullHouseWinners.length === 0) {
    // Find potential second full house winners (exclude existing full house winners)
    const potentialSecondFullHouseByNumber = new Map<number, WinnerDetectionResult[]>();
    
    tickets.forEach(ticket => {
      const booking = ticketToBooking.get(ticket.id);
      if (!booking) return;

      const isAlreadyFullHouseWinner = fullHouseWinners.some(w => w.ticket_id === ticket.id);
      const isAlreadySecondFullHouseWinner = isExistingWinner('second_full_house', ticket.id);
      
      if (!isAlreadyFullHouseWinner && !isAlreadySecondFullHouseWinner && checkFullHouse(ticket, calledNumbers)) {
        const winningNumber = getWinningNumber(ticket, 'second_full_house', calledNumbers);
        if (winningNumber !== null) {
          if (!potentialSecondFullHouseByNumber.has(winningNumber)) {
            potentialSecondFullHouseByNumber.set(winningNumber, []);
          }
          
          potentialSecondFullHouseByNumber.get(winningNumber)!.push({
            prizeType: 'second_full_house',
            ticketId: ticket.id,
            ticketNumber: ticket.ticket_number,
            playerName: booking.player_name,
            playerPhone: booking.player_phone || undefined
          });
        }
      }
    });

    // Find the earliest second full house winners
    if (potentialSecondFullHouseByNumber.size > 0) {
      let earliestWinningNumber = -1;
      let earliestIndex = calledNumbers.length;
      
      potentialSecondFullHouseByNumber.forEach((groupWinners, winningNumber) => {
        const numberIndex = calledNumbers.indexOf(winningNumber);
        if (numberIndex < earliestIndex) {
          earliestIndex = numberIndex;
          earliestWinningNumber = winningNumber;
        }
      });
      
      if (earliestWinningNumber !== -1) {
        const winningGroup = potentialSecondFullHouseByNumber.get(earliestWinningNumber)!;
        console.log(`Second full house winners (completed on number ${earliestWinningNumber}):`, winningGroup.map(w => w.ticketNumber));
        winners.push(...winningGroup);
      }
    }
  }

  console.log(`Total new winners detected: ${winners.length}`);
  return winners;
};
