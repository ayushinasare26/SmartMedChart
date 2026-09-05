import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { createAuditLog } from '../utils/audit';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'smartmedchart-super-secret-jwt-key-hipaa-compliant-2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'smartmedchart-refresh-secret-key-hipaa-compliant-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '8h';

function signAccessToken(payload: { id: string; email: string; role: string; name: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

function signRefreshToken(payload: { id: string }) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN as any });
}

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      await createAuditLog({
        action: 'LOGIN_FAILED',
        resource: 'Auth',
        detail: `Failed login attempt for ${email}`,
        req,
        severity: 'Warning',
      });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    const refreshToken = signRefreshToken({ id: user.id });

    // Store refresh token
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    await createAuditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resource: 'Auth',
      detail: `User ${user.name} (${user.role}) authenticated`,
      req,
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        staffId: user.staffId,
        ward: user.ward,
        department: user.department,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const newAccessToken = signAccessToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMe = [
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true, email: true, name: true, role: true,
          staffId: true, ward: true, department: true, isActive: true,
        },
      });
      res.json(user);
    } catch (error) {
      next(error);
    }
  },
];
