import crypto from 'crypto';
import { Response, Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const FILES_DB = path.join(process.cwd(), 'files.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

const getFiles = (): any[] => {
  if (!fs.existsSync(FILES_DB)) return [];
  return JSON.parse(fs.readFileSync(FILES_DB, 'utf-8'));
};

const saveFiles = (files: any[]): void => {
  fs.writeFileSync(FILES_DB, JSON.stringify(files, null, 2));
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// Upload a file
router.post(
  '/upload',
  authenticateToken,
  upload.single('file'),
  (req: AuthRequest, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    // Encrypt the file
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'arun_vault_encryption_key_32char';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const input = fs.readFileSync(req.file.path);
    const encrypted = Buffer.concat([iv, cipher.update(input), cipher.final()]);
    fs.writeFileSync(req.file.path, encrypted);

    const shareCode = uuidv4().split('-')[0].toUpperCase();
    const files = getFiles();
    const newFile = {
      id: uuidv4(),
      userId: req.userId,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      shareCode,
      createdAt: new Date().toISOString(),
    };
    files.push(newFile);
    saveFiles(files);
    res.status(201).json({ message: 'File uploaded and encrypted!', shareCode, id: newFile.id });
  },
);

// List my files
router.get('/list', authenticateToken, (req: AuthRequest, res: Response): void => {
  const files = getFiles().filter((f) => f.userId === req.userId);
  res.json(files.map(({ userId: _u, storedName: _s, ...rest }) => rest));
});

// Download via share code
router.get('/share/:code', (req, res: Response): void => {
  const files = getFiles();
  const file = files.find((f) => f.shareCode === req.params.code.toUpperCase());
  if (!file) {
    res.status(404).json({ error: 'Invalid share code.' });
    return;
  }

  const filePath = path.join(UPLOADS_DIR, file.storedName);
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'arun_vault_encryption_key_32char';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const encrypted = fs.readFileSync(filePath);
  const iv = encrypted.slice(0, 16);
  const data = encrypted.slice(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);

  res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
  res.setHeader('Content-Type', file.mimetype);
  res.send(decrypted);
});

// Delete a file
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  let files = getFiles();
  const file = files.find((f) => f.id === req.params.id && f.userId === req.userId);
  if (!file) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }
  fs.unlinkSync(path.join(UPLOADS_DIR, file.storedName));
  files = files.filter((f) => f.id !== req.params.id);
  saveFiles(files);
  res.json({ message: 'File deleted.' });
});

export default router;
