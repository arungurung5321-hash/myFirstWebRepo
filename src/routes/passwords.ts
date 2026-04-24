import { Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { decrypt, encrypt } from '../utils/encryption';

const router = Router();
const PASSWORDS_FILE = path.join(process.cwd(), 'passwords.json');

const getPasswords = (): any[] => {
  if (!fs.existsSync(PASSWORDS_FILE)) return [];
  return JSON.parse(fs.readFileSync(PASSWORDS_FILE, 'utf-8'));
};

const savePasswords = (passwords: any[]): void => {
  fs.writeFileSync(PASSWORDS_FILE, JSON.stringify(passwords, null, 2));
};

// Add a password
router.post('/add', authenticateToken, (req: AuthRequest, res: Response): void => {
  const { title, username, password, website } = req.body;
  if (!title || !password) {
    res.status(400).json({ error: 'Title and password are required.' });
    return;
  }
  const passwords = getPasswords();
  const newEntry = {
    id: uuidv4(),
    userId: req.userId,
    title,
    username: username || '',
    password: encrypt(password),
    website: website || '',
    createdAt: new Date().toISOString(),
  };
  passwords.push(newEntry);
  savePasswords(passwords);
  res.status(201).json({ message: 'Password saved securely!', id: newEntry.id });
});

// Get all passwords for user
router.get('/list', authenticateToken, (req: AuthRequest, res: Response): void => {
  const passwords = getPasswords().filter((p) => p.userId === req.userId);
  const decrypted = passwords.map((p) => ({
    ...p,
    password: decrypt(p.password),
  }));
  res.json(decrypted);
});

// Delete a password
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  let passwords = getPasswords();
  const entry = passwords.find((p) => p.id === req.params.id && p.userId === req.userId);
  if (!entry) {
    res.status(404).json({ error: 'Password not found.' });
    return;
  }
  passwords = passwords.filter((p) => p.id !== req.params.id);
  savePasswords(passwords);
  res.json({ message: 'Password deleted.' });
});

export default router;
