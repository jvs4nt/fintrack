import { NextFunction, Request, Response, RequestHandler } from 'express';
import * as jose from 'jose';
import { supabase } from '../lib/supabase';
import { AuthedRequest } from '../types/auth';

const jwtSecret = process.env.SUPABASE_JWT_SECRET?.trim();

/** Chave derivada do JWT Secret do projeto (Dashboard → Settings → API → JWT Secret). */
const jwtVerificationKey = jwtSecret ? new TextEncoder().encode(jwtSecret) : null;

async function userIdFromJwtLocal(token: string): Promise<string | null> {
  if (!jwtVerificationKey) return null;
  try {
    const { payload } = await jose.jwtVerify(token, jwtVerificationKey, {
      algorithms: ['HS256'],
    });
    const sub = payload.sub;
    return typeof sub === 'string' && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.method === 'OPTIONS') {
    next();
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }

  const token = header.slice(7);

  if (jwtVerificationKey) {
    const userId = await userIdFromJwtLocal(token);
    if (userId) {
      (req as AuthedRequest).userId = userId;
      next();
      return;
    }
    res.status(401).json({ error: 'Sessão inválida ou expirada' });
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: 'Sessão inválida ou expirada' });
    return;
  }

  (req as AuthedRequest).userId = data.user.id;
  next();
};
