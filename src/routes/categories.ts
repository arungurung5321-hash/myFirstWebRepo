import { Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const CATEGORIES_FILE = path.join(process.cwd(), 'categories.json');

const getCategories = (): any[] => {
  if (!fs.existsSync(CATEGORIES_FILE)) return [];
  return JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8'));
};

const saveCategories = (categories: any[]): void => {
  fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
};

// Create category
router.post('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }
  const categories = getCategories();
  const category = {
    id: uuidv4(),
    userId: req.userId,
    name,
    createdAt: new Date().toISOString(),
  };
  categories.push(category);
  saveCategories(categories);
  res.status(201).json(category);
});

// List categories
router.get('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  const categories = getCategories().filter((c) => c.userId === req.userId);
  res.json(categories);
});

// Rename category
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  const categories = getCategories();
  const category = categories.find((c) => c.id === req.params.id && c.userId === req.userId);
  if (!category) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }
  if (!req.body.name) {
    res.status(400).json({ error: 'Name is required.' });
    return;
  }
  category.name = req.body.name;
  saveCategories(categories);
  res.json(category);
});

// Delete category
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  let categories = getCategories();
  const category = categories.find((c) => c.id === req.params.id && c.userId === req.userId);
  if (!category) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }
  categories = categories.filter((c) => c.id !== req.params.id);
  saveCategories(categories);
  res.status(204).send();
});

export default router;
