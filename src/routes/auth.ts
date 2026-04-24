import bcrypt from 'bcrypt';
import { Request, Response, Router } from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const USERS_FILE = path.join(process.cwd(), 'users.json');

const getUsers = (): any[] => {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
};

const saveUsers = (users: any[]): void => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required.' });
    return;
  }
  const users = getUsers();
  if (users.find((u) => u.username === username)) {
    res.status(400).json({ error: 'Username already exists.' });
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: uuidv4(), username, password: hashedPassword };
  users.push(newUser);
  saveUsers(users);
  res.status(201).json({ message: 'User registered successfully!' });
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  const users = getUsers();
  const user = users.find((u) => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: 'Invalid credentials.' });
    return;
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '24h',
  });
  res.json({ token, username: user.username });
});

export default router;
