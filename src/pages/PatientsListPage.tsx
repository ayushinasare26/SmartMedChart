import { useQuery } from '@tanstack/react-query';
import { patientService } from '../services/api.services';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Search, Plus, User, QrCode } from 'lucide-react';
import { useState } from 'react';
import { format, differenceInYears } from 'date-fns';
import { HospitalPersonQRModal, HospitalPerson } from '../components/HospitalPersonQRModal';

export default function PatientsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedPatientForQR, setSelectedPatientForQR] = useState<HospitalPerson | null>(null);

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients-all'],
    queryFn: () => patientService.getAll({ status: 'ACTIVE' }),
  });

  const filtered = (patients as any[]).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.mrn.includes(search) ||
    (p.bed || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div className="top-bar">
        <div className="top-bar-section">
          <User size={14} color="var(--color-accent-blue-light)" />
          <span style={{ fontWeight: 700, fontSize: 13 }}>Patient Management</span>
        </div>
        <div style={{ marginLeft: 'auto', padding: '0 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} className="input" placeholder="Search patient name, MRN, or bed..." style={{ paddingLeft: 28, width: 280, height: 34 }} />
          </div>
          <button className="btn-primary" style={{ fontSize: 12 }}><Plus size={13} /> Admit Patient</button>
        </div>
      </div>

      <div className="page-content">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)' }}>
            Active Inpatients — Ward 4B ICU <span style={{ fontSize: 15, fontWeight: 400, color: 'var(--color-text-muted)' }}>({filtered.length} of 18 beds)</span>
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {isLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 20, height: 160, opacity: 0.4 }}>
              <div style={{ background: 'var(--color-bg-hover)', borderRadius: 4, height: 14, width: '60%', marginBottom: 8 }} />
              <div style={{ background: 'var(--color-bg-hover)', borderRadius: 4, height: 10, width: '40%', marginBottom: 6 }} />
              <div style={{ background: 'var(--color-bg-hover)', borderRadius: 4, height: 10, width: '80%' }} />
            </div>
          ))}

          {filtered.map((p: any) => {
            const age = p.dob ? differenceInYears(new Date(), new Date(p.dob)) : '—';
            const hasAllergy = p.allergies?.length > 0;
            const criticalAllergy = p.allergies?.some((a: any) => a.severity === 'Anaphylaxis' || a.severity === 'Severe');
            const statRx = p.prescriptions?.some((rx: any) => rx.isStatOrder && rx.status === 'STAT');

            return (
              <div
                key={p.id}
                className="card"
                style={{ padding: 0, cursor: 'pointer', overflow: 'hidden', borderColor: criticalAllergy ? 'rgba(239,68,68,0.3)' : 'var(--color-border)' }}
                onClick={() => navigate(`/patients/${p.id}`)}
              >
                {/* Card Header */}
                <div style={{ padding: '14px 16px', background: 'rgba(10,15,26,0.5)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--color-accent-blue-light)', flexShrink: 0 }}>
                    {(p.bed || 'XX').replace('ICU-', '')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>{p.name}</span>
                      {p.npoStatus && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-due-amber)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 3, padding: '1px 5px' }}>NPO</span>}
                      {p.isolationStatus && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-stat-red)', background: 'var(--color-stat-red-bg)', border: '1px solid var(--color-stat-red-border)', borderRadius: 3, padding: '1px 5px' }}>ISOLATION</span>}
                      {statRx && <span className="chip chip-stat" style={{ fontSize: 9 }}>STAT</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>MRN: {p.mrn} · {p.sex} · {age}y · {p.weight}kg</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent-blue-light)' }}>Bed {p.bed}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPatientForQR({
                          type: 'PATIENT',
                          name: p.name,
                          mrn: p.mrn,
                          dob: p.dob,
                          sex: p.sex,
                          bed: p.bed,
                          ward: 'Ward 4B ICU',
                          allergies: p.allergies,
                          emergencyContactName: p.emergencyContactName,
                          emergencyContactRelation: p.emergencyContactRelation,
                          emergencyContactPhone: p.emergencyContactPhone,
                          attendingName: 'Dr. V. Sharma, MD',
                          admissionDiagnosis: p.admissionDiagnosis
                        });
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 7px',
                        borderRadius: 5,
                        backgroundColor: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        color: 'var(--color-accent-blue-light)',
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="View Patient Digital Wristband & QR Code"
                    >
                      <QrCode size={11} />
                      <span>QR Wristband</span>
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '12px 16px' }}>
                  {p.admissionDiagnosis && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Dx: </span>{p.admissionDiagnosis.slice(0, 60)}{p.admissionDiagnosis.length > 60 ? '...' : ''}
                    </div>
                  )}

                  {/* Allergies */}
                  {hasAllergy && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <AlertTriangle size={11} color={criticalAllergy ? 'var(--color-stat-red)' : 'var(--color-due-amber)'} />
                      <span style={{ fontSize: 11, color: criticalAllergy ? 'var(--color-stat-red)' : 'var(--color-due-amber)', fontWeight: 600 }}>
                        {p.allergies.map((a: any) => a.allergen).join(', ')} Allergy
                      </span>
                    </div>
                  )}

                  {/* Active Prescriptions count */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {p.prescriptions?.slice(0, 3).map((rx: any) => (
                      <span key={rx.id} style={{ fontSize: 10, background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '2px 7px', color: 'var(--color-text-muted)' }}>
                        {rx.medicationName.split(' ')[0]}
                      </span>
                    ))}
                    {(p.prescriptions?.length || 0) > 3 && (
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>+{p.prescriptions.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
            <User size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            {search ? 'No patients matching your search.' : 'No active patients found.'}
          </div>
        )}
      </div>

      {/* Patient Digital Wristband & QR Modal */}
      <HospitalPersonQRModal
        isOpen={!!selectedPatientForQR}
        onClose={() => setSelectedPatientForQR(null)}
        person={selectedPatientForQR}
      />
    </div>
  );
}
