import { Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const VAULTS_FILE = path.join(process.cwd(), 'vaults.json');

const getVaults = (): any[] => {
  if (!fs.existsSync(VAULTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(VAULTS_FILE, 'utf-8'));
};

const saveVaults = (vaults: any[]): void => {
  fs.writeFileSync(VAULTS_FILE, JSON.stringify(vaults, null, 2));
};

// Create a vault
router.post('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Vault name is required.' });
    return;
  }
  const vaults = getVaults();
  const vault = {
    id: uuidv4(),
    userId: req.userId,
    name,
    description: description || '',
    createdAt: new Date().toISOString(),
  };
  vaults.push(vault);
  saveVaults(vaults);
  res.status(201).json(vault);
});

// List all vaults for user
router.get('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  const vaults = getVaults().filter((v) => v.userId === req.userId);
  res.json(vaults);
});

// Get a single vault
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  const vault = getVaults().find((v) => v.id === req.params.id && v.userId === req.userId);
  if (!vault) {
    res.status(404).json({ error: 'Vault not found.' });
    return;
  }
  res.json(vault);
});

// Rename/update a vault
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  const vaults = getVaults();
  const vault = vaults.find((v) => v.id === req.params.id && v.userId === req.userId);
  if (!vault) {
    res.status(404).json({ error: 'Vault not found.' });
    return;
  }
  if (req.body.name) vault.name = req.body.name;
  if (req.body.description !== undefined) vault.description = req.body.description;
  saveVaults(vaults);
  res.json(vault);
});

// Delete a vault
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  let vaults = getVaults();
  const vault = vaults.find((v) => v.id === req.params.id && v.userId === req.userId);
  if (!vault) {
    res.status(404).json({ error: 'Vault not found.' });
    return;
  }
  vaults = vaults.filter((v) => v.id !== req.params.id);
  saveVaults(vaults);
  res.status(204).send();
});

export default router;
