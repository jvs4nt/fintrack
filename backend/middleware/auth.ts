import { NextFunction, Request, Response, RequestHandler } from 'express';
import { supabase } from '../lib/supabase';
import { AuthedRequest } from '../types/auth';

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }

  const token = header.slice(7);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: 'Sessão inválida ou expirada' });
    return;
  }

  (req as AuthedRequest).userId = data.user.id;
  next();
};
