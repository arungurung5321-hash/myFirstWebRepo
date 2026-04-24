import { Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { decrypt, encrypt } from '../utils/encryption';

const router = Router();
const NOTES_FILE = path.join(process.cwd(), 'notes.json');

const getNotes = (): any[] => {
  if (!fs.existsSync(NOTES_FILE)) return [];
  return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf-8'));
};

const saveNotes = (notes: any[]): void => {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
};

// Create a note
router.post('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  const { title, content, vaultId, category } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: 'Title and content are required.' });
    return;
  }
  const notes = getNotes();
  const note = {
    id: uuidv4(),
    userId: req.userId,
    vaultId: vaultId || null,
    title,
    content: encrypt(content),
    category: category || 'general',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  notes.push(note);
  saveNotes(notes);
  res.status(201).json({ ...note, content });
});

// List notes
router.get('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  let notes = getNotes().filter((n) => n.userId === req.userId);
  if (req.query.vaultId) notes = notes.filter((n) => n.vaultId === req.query.vaultId);
  if (req.query.category) notes = notes.filter((n) => n.category === req.query.category);
  if (req.query.search) {
    const s = (req.query.search as string).toLowerCase();
    notes = notes.filter((n) => n.title.toLowerCase().includes(s));
  }
  res.json(notes.map((n) => ({ ...n, content: decrypt(n.content) })));
});

// Get single note
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  const note = getNotes().find((n) => n.id === req.params.id && n.userId === req.userId);
  if (!note) {
    res.status(404).json({ error: 'Note not found.' });
    return;
  }
  res.json({ ...note, content: decrypt(note.content) });
});

// Update a note
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  const notes = getNotes();
  const note = notes.find((n) => n.id === req.params.id && n.userId === req.userId);
  if (!note) {
    res.status(404).json({ error: 'Note not found.' });
    return;
  }
  if (req.body.title) note.title = req.body.title;
  if (req.body.content) note.content = encrypt(req.body.content);
  if (req.body.category) note.category = req.body.category;
  note.updatedAt = new Date().toISOString();
  saveNotes(notes);
  res.json({ ...note, content: req.body.content || decrypt(note.content) });
});

// Delete a note
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  let notes = getNotes();
  const note = notes.find((n) => n.id === req.params.id && n.userId === req.userId);
  if (!note) {
    res.status(404).json({ error: 'Note not found.' });
    return;
  }
  notes = notes.filter((n) => n.id !== req.params.id);
  saveNotes(notes);
  res.status(204).send();
});

export default router;
