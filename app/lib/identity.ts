import crypto from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

export const USER_ID_COOKIE = 'bb_uid';

export function newUserId() {
  return crypto.randomUUID();
}

export function getUserIdFromRequest(req: NextRequest): string | null {
  return req.cookies.get(USER_ID_COOKIE)?.value ?? null;
}

export function setUserIdCookie(res: NextResponse, uid: string) {
  res.cookies.set({
    name: USER_ID_COOKIE,
    value: uid,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1y
  });
}

