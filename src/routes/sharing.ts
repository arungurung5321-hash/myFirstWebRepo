import { Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const SHARING_FILE = path.join(process.cwd(), 'sharing.json');
const VAULTS_FILE = path.join(process.cwd(), 'vaults.json');

const getSharing = (): any[] => {
  if (!fs.existsSync(SHARING_FILE)) return [];
  return JSON.parse(fs.readFileSync(SHARING_FILE, 'utf-8'));
};

const saveSharing = (sharing: any[]): void => {
  fs.writeFileSync(SHARING_FILE, JSON.stringify(sharing, null, 2));
};

const getVaults = (): any[] => {
  if (!fs.existsSync(VAULTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(VAULTS_FILE, 'utf-8'));
};

// Share a vault with another user
router.post('/:vaultId/share', authenticateToken, (req: AuthRequest, res: Response): void => {
  const vault = getVaults().find((v) => v.id === req.params.vaultId && v.userId === req.userId);
  if (!vault) {
    res.status(404).json({ error: 'Vault not found.' });
    return;
  }
  const { sharedWithUsername, permission } = req.body;
  if (!sharedWithUsername) {
    res.status(400).json({ error: 'sharedWithUsername is required.' });
    return;
  }
  const sharing = getSharing();
  const invite = {
    id: uuidv4(),
    vaultId: vault.id,
    ownerId: req.userId,
    sharedWithUsername,
    permission: permission || 'read-only',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  sharing.push(invite);
  saveSharing(sharing);
  res.status(201).json(invite);
});

// View who has access to a vault
router.get('/:vaultId/access', authenticateToken, (req: AuthRequest, res: Response): void => {
  const vault = getVaults().find((v) => v.id === req.params.vaultId && v.userId === req.userId);
  if (!vault) {
    res.status(404).json({ error: 'Vault not found.' });
    return;
  }
  const sharing = getSharing().filter((s) => s.vaultId === req.params.vaultId);
  res.json(sharing);
});

// Accept or decline invitation
router.put('/invites/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  const sharing = getSharing();
  const invite = sharing.find((s) => s.id === req.params.id);
  if (!invite) {
    res.status(404).json({ error: 'Invitation not found.' });
    return;
  }
  const { status } = req.body;
  if (!['accepted', 'declined'].includes(status)) {
    res.status(400).json({ error: 'Status must be accepted or declined.' });
    return;
  }
  invite.status = status;
  saveSharing(sharing);
  res.json(invite);
});

// Remove access
router.delete(
  '/:vaultId/access/:shareId',
  authenticateToken,
  (req: AuthRequest, res: Response): void => {
    let sharing = getSharing();
    const invite = sharing.find((s) => s.id === req.params.shareId && s.ownerId === req.userId);
    if (!invite) {
      res.status(404).json({ error: 'Share not found.' });
      return;
    }
    sharing = sharing.filter((s) => s.id !== req.params.shareId);
    saveSharing(sharing);
    res.status(204).send();
  },
);

export default router;
