import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  gitServiceUrl: process.env.GIT_SERVICE_URL || 'http://localhost:5000',
  dbPath: path.join(__dirname, '../../data/rat.db'),
  uploadDir: path.join(__dirname, '../../data/uploads'),
  reposDir: path.join(__dirname, '../../data/repos'),
};
