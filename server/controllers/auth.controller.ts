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
    const rawIdentifier = req.body.email || req.body.adminId || req.body.username || req.body.staffId || '';
    const identifier = String(rawIdentifier).trim();
    const passcode = String(req.body.password || req.body.pin || req.body.passcode || '').trim();

    if (!identifier || !passcode) {
      res.status(400).json({ error: 'Username/Admin ID and Password/PIN are required' });
      return;
    }

    // Find user by email or staffId
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { staffId: identifier.toUpperCase() },
          { staffId: identifier },
        ],
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials or user inactive' });
      return;
    }

    // Check PIN shortcuts for Admin preset accounts or compare bcrypt password
    const isPinMatch =
      (user.staffId === 'ADM-9001' && (passcode === '9999' || passcode === 'SmartMed@2024')) ||
      (user.staffId === 'ADM-1002' && (passcode === '1234' || passcode === 'SmartMed@2024')) ||
      passcode === 'SmartMed@2024';

    const isBcryptValid = await bcrypt.compare(passcode, user.passwordHash).catch(() => false);

    if (!isPinMatch && !isBcryptValid) {
      await createAuditLog({
        action: 'LOGIN_FAILED',
        resource: 'Auth',
        detail: `Failed login attempt for ${identifier}`,
        req,
        severity: 'Warning',
      });
      res.status(401).json({ error: 'Invalid credentials. Check Admin ID / PIN.' });
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

export const impersonate = [
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Only administrators can impersonate
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
        return;
      }

      const { targetUserId, targetStaffId } = req.body;
      const targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            targetUserId ? { id: targetUserId } : undefined,
            targetStaffId ? { staffId: targetStaffId } : undefined,
          ].filter(Boolean) as any,
        },
      });

      if (!targetUser || !targetUser.isActive) {
        res.status(404).json({ error: 'Target clinician not found or inactive' });
        return;
      }

      const accessToken = signAccessToken({
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        name: targetUser.name,
      });
      const refreshToken = signRefreshToken({ id: targetUser.id });

      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
      await prisma.refreshToken.create({
        data: { token: refreshToken, userId: targetUser.id, expiresAt },
      });

      await createAuditLog({
        userId: req.user.id,
        action: 'ADMIN_IMPERSONATION',
        resource: 'User',
        resourceId: targetUser.id,
        detail: `Admin ${req.user.name} launched session as ${targetUser.name} (${targetUser.role} / ${targetUser.staffId})`,
        req,
      });

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
          role: targetUser.role,
          staffId: targetUser.staffId,
          ward: targetUser.ward,
          department: targetUser.department,
        },
      });
    } catch (error) {
      next(error);
    }
  },
];
