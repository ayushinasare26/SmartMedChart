import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAuditLog } from '../utils/audit';

const scheduleInclude = {
  prescription: {
    include: {
      prescriber: { select: { id: true, name: true, role: true } },
      safetyAlerts: { where: { isResolved: false } },
    },
  },
  patient: { select: { id: true, name: true, mrn: true, bed: true, wardId: true } },
  administeredBy: { select: { id: true, name: true, role: true } },
  administrationRecord: true,
};

export const getSchedules = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientId, status, date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

    const schedules = await prisma.medicationSchedule.findMany({
      where: {
        ...(patientId && {
          OR: [
            { patientId: patientId as string },
            { patient: { mrn: patientId as string } },
          ],
        }),
        ...(status && { status: status as any }),
        scheduledTime: { gte: startOfDay, lte: endOfDay },
      },
      include: scheduleInclude,
      orderBy: { scheduledTime: 'asc' },
    });
    res.json(schedules);
  } catch (error) { next(error); }
};

export const getWardSchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ward, date, shift } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

    const wardRecord = ward ? await prisma.ward.findUnique({ where: { unit: ward as string } }) : null;

    const schedules = await prisma.medicationSchedule.findMany({
      where: {
        scheduledTime: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED'] },
        ...(wardRecord && { patient: { wardId: wardRecord.id } }),
      },
      include: scheduleInclude,
      orderBy: { scheduledTime: 'asc' },
    });
    res.json(schedules);
  } catch (error) { next(error); }
};

export const getSchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schedule = await prisma.medicationSchedule.findUnique({
      where: { id: req.params.id },
      include: scheduleInclude,
    });
    if (!schedule) { res.status(404).json({ error: 'Schedule not found' }); return; }
    res.json(schedule);
  } catch (error) { next(error); }
};

export const administerMedication = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      scheduleId, patientId, dose, unit, route, notes,
      barcodeScanned, fiveRights, witnessId,
    } = req.body;

    const { rightPatient, rightDrug, rightDose, rightRoute, rightTime } = fiveRights || {};
    const fiveRightsVerified = !!(rightPatient && rightDrug && rightDose && rightRoute && rightTime);

    // Update schedule
    const schedule = await prisma.medicationSchedule.update({
      where: { id: scheduleId },
      data: {
        status: 'GIVEN',
        administeredById: req.user!.id,
        administeredAt: new Date(),
        verificationMethod: barcodeScanned ? 'BARCODE_SCAN' : 'MANUAL_ENTRY',
      },
    });

    // Create administration record
    const adminRecord = await prisma.administrationRecord.create({
      data: {
        scheduleId,
        patientId,
        administeredById: req.user!.id,
        dose: parseFloat(dose),
        unit,
        route,
        notes,
        fiveRightsVerified,
        rightPatient: !!rightPatient,
        rightDrug: !!rightDrug,
        rightDose: !!rightDose,
        rightRoute: !!rightRoute,
        rightTime: !!rightTime,
        barcodeScanned: !!barcodeScanned,
        witnessId: witnessId || null,
        safetyScore: fiveRightsVerified ? (barcodeScanned ? 100 : 95) : 70,
        signedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      patientId,
      action: 'MEDICATION_ADMINISTERED',
      resource: 'Administration',
      resourceId: adminRecord.id,
      detail: `${dose}${unit} ${route} administered. 5-Rights: ${fiveRightsVerified ? 'VERIFIED' : 'INCOMPLETE'}. Admin ID: ${adminRecord.adminId}`,
      req: req as any,
    });

    res.status(201).json({ schedule, adminRecord });
  } catch (error) { next(error); }
};

export const holdSchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { holdReason } = req.body;
    const schedule = await prisma.medicationSchedule.update({
      where: { id: req.params.id },
      data: { status: 'HELD', holdReason },
    });
    await createAuditLog({
      userId: req.user?.id,
      patientId: schedule.patientId,
      action: 'SCHEDULE_HELD',
      resource: 'Schedule',
      resourceId: schedule.id,
      detail: holdReason,
      req: req as any,
      severity: 'Warning',
    });
    res.json(schedule);
  } catch (error) { next(error); }
};

export const delaySchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { delayReason, delayMinutes } = req.body;
    const schedule = await prisma.medicationSchedule.update({
      where: { id: req.params.id },
      data: { status: 'DELAYED', delayReason, delayMinutes: parseInt(delayMinutes || '0') },
    });
    res.json(schedule);
  } catch (error) { next(error); }
};
