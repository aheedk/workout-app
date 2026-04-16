export interface BodyweightLog {
  id: string;
  weight: number;
  date: string;
  notes: string | null;
}

export interface CreateBodyweightRequest {
  weight: number;
  date: string;
  notes?: string;
}
