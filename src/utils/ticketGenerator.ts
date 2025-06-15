
export interface TicketData {
  ticket_number: number;
  numbers: number[];
  row1: number[];
  row2: number[];
  row3: number[];
}

export const generateHousieTicket = (ticketNumber: number): TicketData => {
  // Create a 3x9 grid with exactly 5 numbers per row
  const grid: (number | null)[][] = [
    Array(9).fill(null),
    Array(9).fill(null),
    Array(9).fill(null)
  ];

  // Available numbers for each column (1-9, 10-19, 20-29, ..., 80-90)
  const columnRanges = [
    [1, 9],    // Column 0: 1-9
    [10, 19],  // Column 1: 10-19
    [20, 29],  // Column 2: 20-29
    [30, 39],  // Column 3: 30-39
    [40, 49],  // Column 4: 40-49
    [50, 59],  // Column 5: 50-59
    [60, 69],  // Column 6: 60-69
    [70, 79],  // Column 7: 70-79
    [80, 90]   // Column 8: 80-90
  ];

  // Generate available numbers for each column
  const availableNumbers: number[][] = columnRanges.map(([min, max]) => {
    const numbers = [];
    for (let i = min; i <= max; i++) {
      numbers.push(i);
    }
    return shuffleArray(numbers);
  });

  // Place exactly 5 numbers in each row
  for (let row = 0; row < 3; row++) {
    const columnsForThisRow = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 5);
    
    for (const col of columnsForThisRow) {
      if (availableNumbers[col].length > 0) {
        grid[row][col] = availableNumbers[col].pop()!;
      }
    }
  }

  // Extract the numbers for each row (only non-null values)
  const row1 = grid[0].filter(n => n !== null) as number[];
  const row2 = grid[1].filter(n => n !== null) as number[];
  const row3 = grid[2].filter(n => n !== null) as number[];

  // Sort each row by value for better readability
  row1.sort((a, b) => a - b);
  row2.sort((a, b) => a - b);
  row3.sort((a, b) => a - b);

  // Combine all numbers
  const allNumbers = [...row1, ...row2, ...row3].sort((a, b) => a - b);

  return {
    ticket_number: ticketNumber,
    numbers: allNumbers,
    row1,
    row2,
    row3
  };
};

// Fisher-Yates shuffle algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
