import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService, scheduleService } from '../services/api.services';
import { format } from 'date-fns';
import { AlertTriangle, Clock, CheckCircle2, Timer, Activity, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WARD = 'WARD-4B-ICU';

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    GIVEN: { label: 'GIVEN', cls: 'chip-given' },
    PENDING: { label: 'PENDING', cls: 'chip-pending' },
    HELD: { label: 'ON HOLD', cls: 'chip-held' },
    DELAYED: { label: 'DELAYED', cls: 'chip-delayed' },
    MISSED: { label: 'MISSED', cls: 'chip-stat' },
    CANCELLED: { label: 'CANCELLED', cls: 'chip-scheduled' },
  };
  const m = map[status] || { label: status, cls: 'chip-scheduled' };
  return <span className={`chip ${m.cls}`}>{m.label}</span>;
}

function isStatUrgent(s: any) { return s.prescription?.isStatOrder && s.status === 'PENDING'; }
function isDueNow(s: any) {
  if (s.status !== 'PENDING') return false;
  const diff = (new Date(s.scheduledTime).getTime() - Date.now()) / 60000;
  return diff <= 30;
}

export default function NurseDashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-nurse', WARD],
    queryFn: () => dashboardService.nurse({ ward: WARD }),
    refetchInterval: 10000,
  });

  const { data: schedules = [], isLoading: schLoading, refetch: refetchSchedules } = useQuery({
    queryKey: ['ward-schedules', WARD],
    queryFn: () => scheduleService.getWard({ ward: WARD }),
    refetchInterval: 10000,
  });

  const refetch = () => {
    refetchStats();
    refetchSchedules();
  };

  // Cross-tab synchronization for bedside administrations
  useEffect(() => {
    const handleMedAdministered = () => {
      refetch();
    };
    window.addEventListener('smartmed:medication_administered', handleMedAdministered);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'smartmed_last_administered') {
        refetch();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('smartmed:medication_administered', handleMedAdministered);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const isLoading = statsLoading || schLoading;

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-section">
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 12 }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text-primary)' }}>Metropolitan General Hospital</span>
        </div>
        <div className="top-bar-section">
          <Activity size={13} color="var(--color-accent-blue-light)" />
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Ward 4B ICU</span>
        </div>
        <div className="top-bar-section">
          <Clock size={12} />
          <span>Shift 07:00–15:00</span>
        </div>
        <div className="top-bar-section">
          <div className="live-dot" style={{ width: 6, height: 6 }} />
          <span>Station: COW-ICU-084</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
          {stats?.statUrgent > 0 && (
            <span className="chip chip-stat" style={{ fontSize: 12, padding: '4px 10px' }}>
              <AlertTriangle size={12} /> {stats.statUrgent} STAT Alert
            </span>
          )}
          <button onClick={() => refetch()} className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => navigate('/prescriptions/new')} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
            <Plus size={13} /> New CPOE Rx
          </button>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="workflow-steps">
        {['Overview Dashboard', 'Patient eMAR & Schedule', 'CPOE Prescription Form', 'Allergy Safety Alert', 'QR Code Verification'].map((step, i) => (
          <div key={step} className={`workflow-step ${i === 0 ? 'active' : ''}`}>
            <span style={{ background: i === 0 ? 'var(--color-accent-blue)' : 'var(--color-border)', color: i === 0 ? 'white' : 'var(--color-text-muted)', width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
              {i + 1}
            </span>
            {step}
          </div>
        ))}
      </div>

      {/* Patient Banner — STAT */}
      {schedules.some(isStatUrgent) && (
        <div style={{ padding: '10px 24px', background: 'rgba(15, 22, 41, 0.9)', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-stat-red-bg)', border: '1px solid var(--color-stat-red-border)', borderRadius: 8, padding: '10px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-stat-red)', borderRadius: 4, padding: '3px 10px', whiteSpace: 'nowrap' }}>
              <AlertTriangle size={12} color="white" />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'white', textTransform: 'uppercase' }}>STAT URGENT ORDER PENDING</span>
            </div>
            {schedules.filter(isStatUrgent).slice(0, 1).map((s: any) => (
              <div key={s.id} style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{s.prescription?.medicationName}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  Patient: {s.patient?.name} (Bed {s.patient?.bed}) • {s.prescription?.route}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => navigate('/patients')}>View Patient eMAR</button>
              <button className="btn-stat" style={{ fontSize: 12 }} onClick={() => navigate('/bedside-scan')}>
                <Activity size={13} /> Verify & Administer via Bedside Scanner
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-content">
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 24 }}>
          <div className="stat-card">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Due Today</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-text-primary)' }}>{isLoading ? '—' : stats?.dueToday ?? 0}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>ICU Ward 4B · 100% charted</div>
          </div>

          <div className="stat-card due-now">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-due-amber)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Due Now</span>
              <Clock size={16} color="var(--color-due-amber)" />
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-due-amber)' }}>{isLoading ? '—' : (stats?.dueNow ?? 0).toString().padStart(2, '0')}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Immediate Action</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Within &lt;30m</div>
          </div>

          <div className="stat-card completed">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-given-green)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Completed</span>
              <CheckCircle2 size={16} color="var(--color-given-green)" />
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-given-green)' }}>{isLoading ? '—' : (stats?.completed ?? 0).toString().padStart(2, '0')}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Shift Progress {stats?.shiftProgress ?? 0}% of batch</div>
          </div>

          <div className="stat-card" style={stats?.delayed > 0 ? { borderColor: 'var(--color-due-amber-border)' } : {}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Delayed</span>
              <Timer size={16} color="var(--color-due-amber)" />
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: stats?.delayed > 0 ? 'var(--color-due-amber)' : 'var(--color-text-primary)' }}>
              {isLoading ? '—' : (stats?.delayed ?? 0).toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Radiology Hold · ICU-08 & 03</div>
          </div>

          <div className="stat-card stat-urgent">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-stat-red)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>STAT Urgent</span>
              <AlertTriangle size={16} color="var(--color-stat-red)" />
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-stat-red)' }}>
              {isLoading ? '—' : (stats?.statUrgent ?? 0).toString().padStart(2, '0')}
            </div>
            {stats?.statPatients?.[0] && (
              <>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Bed {stats.statPatients[0].patient?.bed}</div>
                <div style={{ fontSize: 11, color: 'var(--color-stat-red)', fontWeight: 600 }}>{stats.statPatients[0].patient?.name}</div>
              </>
            )}
          </div>
        </div>

        {/* Ward Schedule */}
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Ward 4B Active Medication Administration Schedule</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>Live bedside dispensing timeline · Current Shift 07:00–15:00</p>
            </div>
            <button onClick={() => navigate('/prescriptions/new')} className="btn-primary" style={{ fontSize: 12 }}>
              <Plus size={13} /> New CPOE Rx
            </button>
          </div>

          <div>
            {isLoading && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading schedule...</div>
            )}
            {!isLoading && schedules.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>No schedules for today.</div>
            )}
            {(schedules as any[]).map((s: any) => {
              const stat = isStatUrgent(s);
              const dueNow = isDueNow(s);
              const rowClass = stat ? 'stat-urgent' : dueNow ? 'due-now' : s.status === 'GIVEN' ? 'given' : s.status === 'HELD' || s.status === 'DELAYED' ? 'held' : '';
              return (
                <div key={s.id} className={`schedule-row ${rowClass}`}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: stat ? 'var(--color-stat-red)' : dueNow ? 'var(--color-due-amber)' : 'var(--color-text-primary)' }}>
                      {format(new Date(s.scheduledTime), 'HH:mm')}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: stat ? 'var(--color-stat-red)' : dueNow ? 'var(--color-due-amber)' : s.status === 'GIVEN' ? 'var(--color-given-green)' : s.status === 'DELAYED' ? 'var(--color-due-amber)' : 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: 2 }}>
                      {s.status === 'GIVEN' ? 'GIVEN' : dueNow ? 'DUE NOW' : s.status === 'DELAYED' ? `DELAYED +${s.delayMinutes}M` : s.status === 'HELD' ? 'ON HOLD' : 'UPCOMING'}
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>{s.prescription?.medicationName}</span>
                      {stat && <span className="chip chip-stat">STAT URGENT</span>}
                      {dueNow && !stat && <span className="chip chip-due-now">DUE NOW</span>}
                      {s.status === 'GIVEN' && <span className="chip chip-given">✓ GIVEN</span>}
                      {s.status === 'DELAYED' && <span className="chip chip-delayed">DELAYED</span>}
                      {s.status === 'HELD' && <span className="chip chip-held">ON HOLD</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      Pt: {s.patient?.name} (Bed {s.patient?.bed}) · {s.prescription?.route}
                      {s.prescription?.prescriber && ` · Dr. ${s.prescription.prescriber.name}`}
                    </div>
                    {s.administrationRecord && (
                      <div style={{ fontSize: 11, color: 'var(--color-given-green)', marginTop: 2 }}>
                        Signed: {s.administeredBy?.name} at {format(new Date(s.administeredAt), 'HH:mm')}
                        {s.administrationRecord?.barcodeScanned && ' · Verified by 4-Pt Barcode'}
                        {s.administrationRecord?.adminId && ` · Admin ID: ${s.administrationRecord.adminId}`}
                      </div>
                    )}
                    {s.status === 'DELAYED' && s.delayReason && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, fontStyle: 'italic' }}>
                        Reason: {s.delayReason.slice(0, 80)}...
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    {s.administrationRecord && (
                      <span style={{ fontSize: 11, color: 'var(--color-given-green)', fontWeight: 600 }}>100% Safe Match</span>
                    )}
                    {(stat || dueNow) && s.status === 'PENDING' && (
                      <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => navigate(`/bedside-scan?scheduleId=${s.id}`)}>
                        <Activity size={13} /> Administer
                      </button>
                    )}
                    {s.status === 'DELAYED' && (
                      <button className="btn-ghost" style={{ fontSize: 12 }}>Update Status</button>
                    )}
                    {s.status === 'PENDING' && !stat && !dueNow && (
                      <button className="btn-ghost" style={{ fontSize: 12 }}>Prepare</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
