import { Request, Response } from 'express';
import { habitIdCounter, habits } from '../models/habits';
import { pets } from '../models/pets';
import { CreateHabitSchema } from '../validators/habits';
import { isCooked } from './pets';

export const createHabit = (req: Request, res: Response): void => {
  const pet = pets.find((p) => p.id === Number(req.params.petId));
  if (!pet) {
    res.status(404).json({ message: 'Pet not found' });
    return;
  }
  if (isCooked(pet)) {
    res.status(400).json({ message: 'This pet has been cooked. Adopt a new one.' });
    return;
  }
  const result = CreateHabitSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error);
    return;
  }
  const habit = {
    id: habitIdCounter.value++,
    petId: pet.id,
    name: result.data.name,
    category: result.data.category,
    targetFrequency: result.data.targetFrequency,
    statBoost: result.data.statBoost,
  };
  habits.push(habit);
  res.status(201).json(habit);
};

export const listHabits = (req: Request, res: Response): void => {
  const pet = pets.find((p) => p.id === Number(req.params.petId));
  if (!pet) {
    res.status(404).json({ message: 'Pet not found' });
    return;
  }
  let result = habits.filter((h) => h.petId === pet.id);
  if (req.query.category) {
    result = result.filter((h) => h.category === req.query.category);
  }
  res.json(result);
};
