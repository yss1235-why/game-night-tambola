
import React from 'react';
import { Card } from '@/components/ui/card';

interface NumberGridProps {
  calledNumbers: number[];
  currentNumber?: number | null;
}

const NumberGrid: React.FC<NumberGridProps> = ({ calledNumbers, currentNumber }) => {
  // Create a 9x10 grid (90 numbers)
  const createNumberGrid = () => {
    const rows: number[][] = [];
    for (let row = 0; row < 9; row++) {
      const rowNumbers: number[] = [];
      for (let col = 1; col <= 10; col++) {
        const number = row * 10 + col;
        rowNumbers.push(number);
      }
      rows.push(rowNumbers);
    }
    return rows;
  };

  const numberRows = createNumberGrid();

  const getNumberStyle = (number: number) => {
    if (currentNumber === number) {
      return 'bg-yellow-400 text-black font-bold border-2 border-yellow-600';
    }
    if (calledNumbers.includes(number)) {
      return 'bg-green-500 text-white font-semibold';
    }
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Number Grid (1-90)</h2>
      <div className="space-y-1">
        {numberRows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-10 gap-1">
            {row.map((number) => (
              <div
                key={number}
                className={`
                  aspect-square border rounded text-center text-sm transition-colors flex items-center justify-center
                  ${getNumberStyle(number)}
                `}
              >
                {number}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-600 space-y-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border rounded"></div>
            <span>Not Called</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 border rounded"></div>
            <span>Called</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 border-2 border-yellow-600 rounded"></div>
            <span>Current Number</span>
          </div>
        </div>
        <p>Total called: {calledNumbers.length}/90</p>
      </div>
    </Card>
  );
};

export default NumberGrid;
