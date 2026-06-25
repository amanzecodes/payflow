import express from "express";
import cors from "cors";
import helmet from 'helmet'
import { requestLogger } from "./middleware/logger.middleware";

const app = express();

app.use(helmet())
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)


app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
