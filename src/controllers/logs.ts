import { Request, Response } from 'express';
import { habits } from '../models/habits';
import { logIdCounter, logs } from '../models/logs';
import { pets } from '../models/pets';
import { CreateLogSchema } from '../validators/logs';
import { isCooked } from './pets';

export const createLog = (req: Request, res: Response): void => {
  const pet = pets.find((p) => p.id === Number(req.params.petId)) as any;
  if (!pet) {
    res.status(404).json({ message: 'Pet not found' });
    return;
  }
  if (isCooked(pet)) {
    res.status(400).json({ message: 'This pet has been cooked. Adopt a new one.' });
    return;
  }
  const result = CreateLogSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error);
    return;
  }
  const habit = habits.find((h) => h.id === result.data.habitId && h.petId === pet.id);
  if (!habit) {
    res.status(400).json({ message: 'Habit does not belong to this pet' });
    return;
  }
  // Boost the stat by 10, clamped at 100
  const stat = habit.statBoost as 'happiness' | 'hunger' | 'energy';
  pet[stat] = Math.min(100, pet[stat] + 10);
  pet.totalLogs = (pet.totalLogs || 0) + 1;
  pet.lastFedAt = new Date();

  const log = {
    id: logIdCounter.value++,
    petId: pet.id,
    habitId: habit.id,
    date: result.data.date,
    note: result.data.note,
  };
  logs.push(log);
  res.status(201).json(log);
};
