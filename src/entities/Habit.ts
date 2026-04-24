export type Habit = {
  id: number;
  petId: number;
  name: string;
  category: 'health' | 'fitness' | 'mindfulness' | 'learning' | 'social';
  targetFrequency: number;
  statBoost: 'happiness' | 'hunger' | 'energy';
};
