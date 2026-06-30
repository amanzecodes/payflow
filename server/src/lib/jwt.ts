import jwt from 'jsonwebtoken'
import { Response } from 'express'
import { env } from '../config/env'
import { JwtPayload, AuthTokens } from '../types'

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any
  })
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET + '-refresh', {
    expiresIn: '30d'
  })
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET + '-refresh') as JwtPayload
}

export function generateTokens(payload: JwtPayload): AuthTokens {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  }
}

export function setTokenCookies(res: Response, tokens: AuthTokens): void {
  const isProduction = env.NODE_ENV === 'production'

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }

  res.cookie('access_token', tokens.accessToken, cookieOptions)
  res.cookie('refresh_token', tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  })
}

export function clearTokenCookies(res: Response): void {
  res.clearCookie('access_token')
  res.clearCookie('refresh_token')
}