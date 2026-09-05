import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';
import { createAuditLog } from '../utils/audit';

const router = Router();
router.use(authenticate as any);

// GET /api/users
router.get('/', authorize('ADMIN', 'DOCTOR') as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, name: true, role: true,
        staffId: true, ward: true, department: true, isActive: true, createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (error) { next(error); }
});

// POST /api/users
router.post('/', authorize('ADMIN') as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bcrypt = await import('bcryptjs');
    const { email, name, role, password, staffId, ward, department } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), name, role, passwordHash, staffId, ward, department },
      select: { id: true, email: true, name: true, role: true, staffId: true, ward: true, department: true },
    });
    await createAuditLog({ userId: req.user?.id, action: 'USER_CREATED', resource: 'User', resourceId: user.id, detail: `User ${user.name} (${user.role}) created`, req: req as any });
    res.status(201).json(user);
  } catch (error) { next(error); }
});

// PATCH /api/users/:id
router.patch('/:id', authorize('ADMIN') as any, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { password, ...rest } = req.body;
    let data: any = rest;
    if (password) {
      const bcrypt = await import('bcryptjs');
      data.passwordHash = await bcrypt.hash(password, 12);
    }
    const user = await prisma.user.update({ where: { id: req.params.id }, data, select: { id: true, email: true, name: true, role: true, isActive: true } });
    res.json(user);
  } catch (error) { next(error); }
});

export default router;
