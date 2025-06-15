
export type GameStatus = 'waiting' | 'active' | 'paused' | 'ended';
export type PrizeType = 'first_line' | 'second_line' | 'third_line' | 'full_house' | 'early_five' | 'corners';

export interface Game {
  id: string;
  host_id: string;
  status: GameStatus;
  current_number: number | null;
  numbers_called: number[];
  number_calling_delay: number;
  host_phone?: string;
  ticket_set?: string;
  selected_prizes?: string[]; // Changed from PrizeType[] to string[] to match database
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: number;
  ticket_number: number;
  numbers: number[];
  row1: number[];
  row2: number[];
  row3: number[];
}

export interface Booking {
  id: string;
  game_id: string;
  ticket_id: number;
  player_name: string;
  player_phone: string | null;
  booked_at: string;
}

export interface Winner {
  id: string;
  game_id: string;
  ticket_id: number;
  prize_type: PrizeType;
  claimed_at: string;
}

export interface AdminWinnerSetting {
  id: string;
  game_id: string;
  ticket_number: number;
  prize_type: PrizeType;
}
