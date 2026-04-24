import { differenceInMilliseconds } from 'date-fns';
import { Request, Response } from 'express';
import { petIdCounter, pets } from '../models/pets';
import { NEGLECT_THRESHOLD_MS } from '../utils/config';
import { CreatePetSchema, UpdatePetSchema } from '../validators/pets';

export const computeStage = (pet: any) => {
  const isCooked = differenceInMilliseconds(new Date(), pet.lastFedAt) > NEGLECT_THRESHOLD_MS;
  if (isCooked) return { stage: 'Cooked', stageEmoji: '🍗' };
  const totalLogs = pet.totalLogs || 0;
  if (totalLogs === 0) return { stage: 'Egg', stageEmoji: '🥚' };
  if (totalLogs <= 4) return { stage: 'Hatching', stageEmoji: '🐣' };
  if (totalLogs <= 14) return { stage: 'Growing', stageEmoji: '🐥' };
  return { stage: 'Grown', stageEmoji: '🐓' };
};

export const isCooked = (pet: any): boolean => {
  return differenceInMilliseconds(new Date(), pet.lastFedAt) > NEGLECT_THRESHOLD_MS;
};

export const createPet = (req: Request, res: Response): void => {
  const result = CreatePetSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error);
    return;
  }
  const pet = {
    id: petIdCounter.value++,
    name: result.data.name,
    species: result.data.species,
    happiness: 50,
    hunger: 50,
    energy: 50,
    lastFedAt: new Date(),
    totalLogs: 0,
  };
  pets.push(pet);
  res.status(201).json({ ...pet, ...computeStage(pet) });
};

export const listPets = (req: Request, res: Response): void => {
  let result = [...pets];
  if (req.query.species) {
    result = result.filter((p) => p.species === req.query.species);
  }
  if (req.query.minHappiness) {
    const min = Number(req.query.minHappiness);
    result = result.filter((p) => p.happiness >= min);
  }
  res.json(result.map((p) => ({ ...p, ...computeStage(p) })));
};

export const getPet = (req: Request, res: Response): void => {
  const pet = pets.find((p) => p.id === Number(req.params.petId));
  if (!pet) {
    res.status(404).json({ message: 'Pet not found' });
    return;
  }
  res.json({ ...pet, ...computeStage(pet) });
};

export const updatePet = (req: Request, res: Response): void => {
  const pet = pets.find((p) => p.id === Number(req.params.petId));
  if (!pet) {
    res.status(404).json({ message: 'Pet not found' });
    return;
  }
  const result = UpdatePetSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json(result.error);
    return;
  }
  pet.name = result.data.name;
  res.json({ ...pet, ...computeStage(pet) });
};

export const deletePet = (req: Request, res: Response): void => {
  const index = pets.findIndex((p) => p.id === Number(req.params.petId));
  if (index === -1) {
    res.status(404).json({ message: 'Pet not found' });
    return;
  }
  pets.splice(index, 1);
  res.status(204).send();
};
