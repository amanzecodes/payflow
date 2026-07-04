import express, { Request, Response } from "express";
import cors from "cors";
import helmet from 'helmet'
import { requestLogger } from "./middleware/logger.middleware";
import { errorMiddleware } from './middleware/error.middleware'
import cookieParser from 'cookie-parser'
import { router } from "./routes";

const app = express();

app.use(express.json({
  verify(req: Request, res: Response, buf: Buffer) {
    req.rawBody = buf.toString('utf8')
  },
}));

app.use(express.urlencoded({ extended: true }))


app.post('/test-webhook', (req, res) => {
  console.log('RAW BODY:', req.body)
  console.log('HEADERS:', req.headers)
  res.send('ok')
})

app.use(helmet())

const isDevelopment = process.env.NODE_ENV !== 'production'
const corsOrigin = isDevelopment
  ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedPatterns = [
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/,
        /^http:\/\/192\.168\..*(:\d+)?$/,
        /^http:\/\/10\..*(:\d+)?$/,
        /^http:\/\/172\..*(:\d+)?$/,
        /^https:\/\/.+\.outray\.app$/,
      ]
      if (!origin || allowedPatterns.some(pattern => pattern.test(origin))) {
        callback(null, true)
      } else {
        console.warn(`CORS request from ${origin} rejected`)
        callback(null, false)
      }
    }
  : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedUrls = [
        process.env.CLIENT_URL || 'https://payflow-lemon.vercel.app',
        'https://payflow-lemon.vercel.app',
      ]
      if (!origin || allowedUrls.includes(origin)) {
        callback(null, true)
      } else {
        console.warn(`CORS request from ${origin} rejected`)
        callback(null, false)
      }
    }

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(cookieParser())
app.use(requestLogger)


app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use('/api/v1', router)
app.use(errorMiddleware)

export default app;
