import 'dotenv/config';
import express from 'express';
import { createHabit, listHabits } from './controllers/habits';
import { createLog } from './controllers/logs';
import { createPet, deletePet, getPet, listPets, updatePet } from './controllers/pets';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import fileRoutes from './routes/files';
import noteRoutes from './routes/notes';
import passwordRoutes from './routes/passwords';
import sharingRoutes from './routes/sharing';
import vaultRoutes from './routes/vaults';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Private Vault routes
app.get('/', (_req, res) => {
  res.json({
    message: '🔐 Welcome to Arun Private Vault API',
    routes: {
      auth: '/auth/register, /auth/login',
      vaults: '/vaults',
      files: '/files/upload, /files/list',
      passwords: '/passwords/add, /passwords/list',
      notes: '/notes',
      categories: '/categories',
      pets: '/pets (Tender API)',
    },
  });
});
app.use('/auth', authRoutes);
app.use('/files', fileRoutes);
app.use('/passwords', passwordRoutes);
app.use('/vaults', vaultRoutes);
app.use('/notes', noteRoutes);
app.use('/categories', categoryRoutes);
app.use('/vaults', sharingRoutes);

// Tender pet routes
app.post('/pets', createPet);
app.get('/pets', listPets);
app.get('/pets/:petId', getPet);
app.put('/pets/:petId', updatePet);
app.delete('/pets/:petId', deletePet);
app.post('/pets/:petId/habits', createHabit);
app.get('/pets/:petId/habits', listHabits);
app.post('/pets/:petId/logs', createLog);

app.listen(PORT, () => {
  console.log(`Hello, Arun!`);
  console.log(`Server running on http://localhost:${PORT}`);
});
