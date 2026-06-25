import express from "express";
import cors from "cors";
import helmet from 'helmet'
import { requestLogger } from "./middleware/logger.middleware";
import { errorMiddleware } from './middleware/error.middleware'
import cookieParser from 'cookie-parser'
import { router } from "./routes";

const app = express();

app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true 
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(requestLogger)


app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use('/api/v1', router)
app.use(errorMiddleware)

export default app;
