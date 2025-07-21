import { sign, verify } from "hono/jwt";

export interface DecodedToken {
  email: string;
  id: string;
  [key: string]: any;
}

export interface TokenVerificationResponse {
  error?: string;
  decoded?: DecodedToken;
}

function getExpiry(secondsFromNow: number) {
  return Math.floor(Date.now() / 1000) + secondsFromNow;
}

export async function generateAccessToken(payload: DecodedToken): Promise<string> {
  const exp = getExpiry(15 * 60);
  return await sign({ ...payload, exp }, process.env.JWT_SECRET!, 'HS256');
}

export async function generateRefreshToken(payload: DecodedToken): Promise<string> {
  const exp = getExpiry(7 * 24 * 60 * 60);
  return await sign({ ...payload, exp }, process.env.JWT_REFRESH_SECRET!, 'HS256');
}

export async function verifyAccessToken(token: string): Promise<TokenVerificationResponse> {
  try {
    const decoded = await verify(token, process.env.JWT_SECRET!);
    if (!decoded || typeof decoded !== "object" || !decoded.email || !decoded.id) {
      return { error: "Invalid token" };
    }
    return { decoded: decoded as DecodedToken };
  } catch (error) {
    return { error: "Invalid or expired access token" };
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenVerificationResponse> {
  try {
    const decoded = await verify(token, process.env.JWT_REFRESH_SECRET!);
    if (!decoded || typeof decoded !== "object" || !decoded.email || !decoded.id) {
      return { error: "Invalid token" };
    }
    return { decoded: decoded as DecodedToken };
  } catch (error) {
    return { error: "Invalid or expired refresh token" };
  }
}

