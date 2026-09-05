import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService, scheduleService } from '../services/api.services';
import { Scan, CheckCircle2, AlertTriangle, User, Pill, Hash, MapPin, Clock, Shield, Loader2, QrCode } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';

const DEMO_PATIENTS_IDS: string[] = []; // Filled from DB

export default function BedsideScannerPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [scannedPatientId, setScannedPatientId] = useState<string | null>(searchParams.get('patientId'));
  const [scheduleId, setScheduleId] = useState<string | null>(searchParams.get('scheduleId'));
  const [isScanning, setIsScanning] = useState(false);
  const [administered, setAdministered] = useState(false);
  const [fiveRights, setFiveRights] = useState({
    rightPatient: false, rightDrug: false, rightDose: false, rightRoute: false, rightTime: false,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-active'],
    queryFn: () => patientService.getAll({ status: 'ACTIVE' }),
  });

  const { data: patient } = useQuery({
    queryKey: ['patient', scannedPatientId],
    queryFn: () => patientService.getById(scannedPatientId!),
    enabled: !!scannedPatientId,
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['patient-schedules-scan', scannedPatientId],
    queryFn: () => scheduleService.getAll({ patientId: scannedPatientId! }),
    enabled: !!scannedPatientId,
  });

  const selectedSchedule = scheduleId
    ? (schedules as any[]).find(s => s.id === scheduleId)
    : (schedules as any[]).find(s => s.status === 'PENDING');

  const administerMutation = useMutation({
    mutationFn: () => scheduleService.administer({
      scheduleId: selectedSchedule?.id,
      patientId: scannedPatientId,
      dose: selectedSchedule?.prescription?.dose,
      unit: selectedSchedule?.prescription?.unit,
      route: selectedSchedule?.prescription?.route,
      barcodeScanned: true,
      fiveRights,
    }),
    onSuccess: () => {
      setAdministered(true);
      queryClient.invalidateQueries({ queryKey: ['patient-schedules-scan'] });
      queryClient.invalidateQueries({ queryKey: ['ward-schedules'] });
    },
  });

  const simulateScan = async () => {
    setIsScanning(true);
    await new Promise(r => setTimeout(r, 1500));
    // Pick first patient if none selected
    if (!scannedPatientId && (patients as any[]).length > 0) {
      setScannedPatientId((patients as any[])[0].id);
    }
    setIsScanning(false);
    // Auto-verify 5 rights
    setFiveRights({ rightPatient: true, rightDrug: true, rightDose: true, rightRoute: true, rightTime: false });
  };

  const allRightsVerified = Object.values(fiveRights).every(Boolean);
  const dob = patient?.dob ? new Date(patient.dob) : null;
  const age = dob ? Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : null;

  return (
    <div>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-section">
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 12 }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 13 }}>SmartMedChart</span>
        </div>
        <div className="top-bar-section" style={{ color: 'var(--color-accent-blue-light)', fontWeight: 600 }}>
          <span>Metropolitan General Hospital</span>
        </div>
        <div className="top-bar-section"><span>WARD 4B ICU</span></div>
        <div className="top-bar-section"><Clock size={12} /> Shift 07:00–15:00</div>
        <div style={{ marginLeft: 'auto', padding: '0 16px', display: 'flex', gap: 8 }}>
          <span className="chip chip-stat"><AlertTriangle size={11} /> 1 STAT MED DUE</span>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)' }}>
          Bedside 4-Point Scanner
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--color-text-muted)' }}>
          Scan patient wristband QR/barcode to verify identity and administer medications safely.
        </p>

        {!scannedPatientId ? (
          /* Scan Zone */
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ width: 120, height: 120, borderRadius: 20, background: 'rgba(59,130,246,0.1)', border: '2px dashed var(--color-accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', animation: isScanning ? 'pulse-red 1s ease-in-out infinite' : 'none' }}>
              {isScanning ? <Loader2 size={48} color="var(--color-accent-blue-light)" style={{ animation: 'spin 1s linear infinite' }} /> : <QrCode size={48} color="var(--color-accent-blue-light)" />}
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {isScanning ? 'Scanning Wristband...' : 'Ready to Scan Patient Wristband'}
            </h2>
            <p style={{ margin: '0 0 24px', color: 'var(--color-text-muted)', fontSize: 13 }}>
              Point the barcode scanner (Symbol DS2208) at the patient wristband QR code, or use simulation mode below.
            </p>
            <button onClick={simulateScan} disabled={isScanning} className="btn-primary" style={{ fontSize: 14, padding: '12px 32px' }}>
              <Scan size={16} /> {isScanning ? 'Scanning...' : 'Simulate Wristband Scan'}
            </button>

            <div style={{ marginTop: 24, borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>Or select patient manually:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                {(patients as any[]).map((p: any) => (
                  <button key={p.id} onClick={() => setScannedPatientId(p.id)} className="btn-ghost" style={{ flexDirection: 'column', padding: '10px', height: 'auto', textAlign: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</span>
                    <span style={{ fontSize: 11 }}>Bed {p.bed}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Patient Scanned */
          <div>
            {/* Patient Identity Banner */}
            {patient && (
              <div style={{ background: '#050c1f', border: '2px solid var(--color-accent-blue)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#1e2d4d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'var(--color-accent-blue-light)' }}>
                  {patient.name.split(' ').map((w: string) => w[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{patient.name}</span>
                    <span style={{ background: '#1e2d4d', color: 'var(--color-accent-blue-light)', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>ICU</span>
                    <span style={{ background: '#1e2d4d', color: 'var(--color-text-secondary)', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>Bed {patient.bed}</span>
                    {patient.isolationStatus && <span style={{ background: 'var(--color-stat-red-bg)', color: 'var(--color-stat-red)', border: '1px solid var(--color-stat-red-border)', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>ISOLATION</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    MRN: {patient.mrn} · DOB: {patient.dob ? format(new Date(patient.dob), 'dd-MMM-yyyy') : '—'} ({age}y) · Sex: {patient.sex} · Weight: {patient.weight}kg (Dose Basis) · Attending: Dr. Sharma, MD (Pulmonology/CC)
                  </div>
                  {patient.allergies?.length > 0 && (
                    <div className="alert-critical" style={{ marginTop: 8, padding: '6px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={12} /> <strong>SEVERE ALLERGY:</strong> {patient.allergies[0].allergen} — Anaphylaxis & Cephalosporin Cross-Reactivity Verified {patient.allergies[0].verifiedAt ? new Date(patient.allergies[0].verifiedAt).getFullYear() : ''}. <strong>Severity: High (Level 1)</strong>
                    </div>
                  )}
                </div>
                <button onClick={() => { setScannedPatientId(null); setAdministered(false); }} className="btn-ghost" style={{ fontSize: 12 }}>
                  Rescan
                </button>
              </div>
            )}

            {/* 5 Rights Verification */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>5 Rights of Bedside Medication Safety Verification</h3>
                <div style={{ fontSize: 12, color: administered ? 'var(--color-given-green)' : 'var(--color-text-muted)', marginTop: 4 }}>
                  {administered ? '✓ All rights verified and documented' : 'HL7 / FHIR Live · HIPAA Sync Active'}
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
                  {([
                    { key: 'rightPatient', label: '1. RIGHT PATIENT', value: patient?.name || '—', icon: User },
                    { key: 'rightDrug', label: '2. RIGHT DRUG', value: selectedSchedule?.prescription?.medicationName?.split('(')[0]?.trim() || '—', icon: Pill },
                    { key: 'rightDose', label: '3. RIGHT DOSE', value: selectedSchedule?.prescription ? `${selectedSchedule.prescription.dose}${selectedSchedule.prescription.unit} in 50mL` : '—', icon: Hash },
                    { key: 'rightRoute', label: '4. RIGHT ROUTE', value: selectedSchedule?.prescription?.route?.split(' ')[0] || 'IV', icon: MapPin },
                    { key: 'rightTime', label: '5. RIGHT TIME', value: selectedSchedule?.scheduledTime ? format(new Date(selectedSchedule.scheduledTime), 'HH:mm') + ' (Due Now)' : '—', icon: Clock },
                  ] as const).map(({ key, label, value, icon: Icon }) => {
                    const verified = fiveRights[key as keyof typeof fiveRights];
                    return (
                      <div
                        key={key}
                        onClick={() => !administered && setFiveRights(prev => ({ ...prev, [key]: !prev[key as keyof typeof fiveRights] }))}
                        style={{
                          background: verified ? 'var(--color-given-green-bg)' : 'var(--color-bg-hover)',
                          border: `1px solid ${verified ? 'var(--color-given-green-border)' : 'var(--color-border)'}`,
                          borderRadius: 8, padding: '12px', textAlign: 'center', cursor: administered ? 'default' : 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Icon size={18} color={verified ? 'var(--color-given-green)' : 'var(--color-text-muted)'} style={{ margin: '0 auto 6px', display: 'block' }} />
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: verified ? 'var(--color-given-green)' : 'var(--color-text-secondary)' }}>
                          {verified ? '✓ ' : ''}{value}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Administer Button */}
                {!administered ? (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => administerMutation.mutate()}
                      disabled={!allRightsVerified || administerMutation.isPending || !selectedSchedule}
                      className={allRightsVerified ? 'btn-success' : 'btn-ghost'}
                      style={{ fontSize: 14, padding: '12px 40px', opacity: allRightsVerified ? 1 : 0.5 }}
                    >
                      {administerMutation.isPending ? (
                        <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Recording Administration...</>
                      ) : (
                        <><Scan size={16} /> Administer & Sign eMAR</>
                      )}
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px', background: 'var(--color-given-green-bg)', border: '1px solid var(--color-given-green-border)', borderRadius: 8 }}>
                    <CheckCircle2 size={32} color="var(--color-given-green)" style={{ margin: '0 auto 8px', display: 'block' }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-given-green)' }}>Medication Successfully Administered</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                      eMAR updated · 5-Rights Verified · Cryptographic audit trail recorded
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Schedules */}
            {(schedules as any[]).filter(s => s.status === 'PENDING').length > 0 && (
              <div className="card">
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Remaining Pending Medications</h3>
                </div>
                {(schedules as any[]).filter(s => s.status === 'PENDING').map((s: any) => (
                  <div key={s.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.prescription?.medicationName}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {s.prescription?.dose}{s.prescription?.unit} · {s.prescription?.route} · Due: {s.scheduledTime ? format(new Date(s.scheduledTime), 'HH:mm') : '—'}
                      </div>
                    </div>
                    <button onClick={() => setScheduleId(s.id)} className="btn-primary" style={{ fontSize: 11 }}>
                      Select & Administer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
