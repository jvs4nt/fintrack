import { Request } from 'express';

export type AuthedRequest = Request & {
  userId: string;
};

export function getUserId(req: Request): string {
  const userId = (req as AuthedRequest).userId;
  if (!userId) {
    throw new Error('userId ausente no request autenticado');
  }
  return userId;
}

export function routeParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export function routeParamInt(value: string | string[]): number {
  return parseInt(routeParam(value), 10);
}
