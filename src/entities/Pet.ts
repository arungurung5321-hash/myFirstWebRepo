export type Pet = {
  id: number;
  name: string;
  species: 'cat' | 'dragon' | 'blob' | 'plant' | 'rock';
  happiness: number;
  hunger: number;
  energy: number;
  lastFedAt: Date;
};
