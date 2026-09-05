import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAuditLog } from '../utils/audit';

export const getPatients = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ward, status, search } = req.query;
    const patients = await prisma.patient.findMany({
      where: {
        ...(ward && { ward: { unit: ward as string } }),
        ...(status && { status: status as any }),
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { mrn: { contains: search as string, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        allergies: true,
        ward: true,
        prescriptions: {
          where: { status: { in: ['ACTIVE', 'STAT'] } },
          include: { prescriber: { select: { name: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(patients);
  } catch (error) { next(error); }
};

export const searchPatients = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q || (q as string).length < 2) { res.json([]); return; }
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { name: { contains: q as string, mode: 'insensitive' } },
          { mrn: { contains: q as string, mode: 'insensitive' } },
          { bed: { contains: q as string, mode: 'insensitive' } },
        ],
      },
      include: { ward: true, allergies: true },
      take: 10,
    });
    res.json(patients);
  } catch (error) { next(error); }
};

export const getPatient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        allergies: true,
        ward: true,
        prescriptions: {
          include: {
            prescriber: { select: { id: true, name: true, role: true } },
            schedules: {
              where: { status: { in: ['PENDING', 'GIVEN', 'HELD', 'DELAYED'] } },
              orderBy: { scheduledTime: 'asc' },
              take: 20,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        safetyAlerts: {
          where: { isResolved: false },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!patient) { res.status(404).json({ error: 'Patient not found' }); return; }
    res.json(patient);
  } catch (error) { next(error); }
};

export const createPatient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patient = await prisma.patient.create({ data: req.body });
    await createAuditLog({
      userId: req.user?.id,
      patientId: patient.id,
      action: 'PATIENT_CREATED',
      resource: 'Patient',
      resourceId: patient.id,
      detail: `Patient ${patient.name} (MRN: ${patient.mrn}) admitted`,
      req: req as any,
    });
    res.status(201).json(patient);
  } catch (error) { next(error); }
};

export const updatePatient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await createAuditLog({
      userId: req.user?.id,
      patientId: patient.id,
      action: 'PATIENT_UPDATED',
      resource: 'Patient',
      resourceId: patient.id,
      detail: `Patient record updated`,
      req: req as any,
    });
    res.json(patient);
  } catch (error) { next(error); }
};

export const getPatientAllergies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allergies = await prisma.allergy.findMany({
      where: { patientId: req.params.id },
    });
    res.json(allergies);
  } catch (error) { next(error); }
};

export const addAllergy = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allergy = await prisma.allergy.create({
      data: { ...req.body, patientId: req.params.id },
    });
    await createAuditLog({
      userId: req.user?.id,
      patientId: req.params.id,
      action: 'ALLERGY_ADDED',
      resource: 'Allergy',
      resourceId: allergy.id,
      detail: `Allergy to ${allergy.allergen} documented`,
      req: req as any,
      severity: 'Warning',
    });
    res.status(201).json(allergy);
  } catch (error) { next(error); }
};
