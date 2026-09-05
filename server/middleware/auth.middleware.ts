import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'smartmedchart-super-secret-jwt-key-hipaa-compliant-2024';
    const decoded = jwt.verify(token, secret) as {
      id: string; email: string; role: string; name: string;
    };

    if (decoded.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, mrn: true, status: true },
      });

      if (!patient) {
        res.status(401).json({ error: 'Patient chart not found' });
        return;
      }

      req.user = {
        id: patient.id,
        email: `${patient.mrn}@patient.smartmedchart.org`,
        role: 'PATIENT',
        name: patient.name,
      };
      next();
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id, isActive: true },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    console.error('[AUTH ERROR]:', error.message);
    res.status(401).json({ error: 'Invalid or expired token', detail: error?.message });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions', required: roles, current: req.user.role });
      return;
    }
    next();
  };
};
