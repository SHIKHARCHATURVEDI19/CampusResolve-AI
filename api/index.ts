import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from '../server/routes/api.ts';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Mount the exact same API router under /api
app.use('/api', apiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

export default app;
