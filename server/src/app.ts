import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Routes will be mounted here

app.use(errorHandler);
