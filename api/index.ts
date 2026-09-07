import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from '../server/routes/api.ts';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Handle both /api and direct root if rewritten
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

export default app;
