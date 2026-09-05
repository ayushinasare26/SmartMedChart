import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Shield, Eye, EyeOff, Fingerprint, Key, Smartphone, AlertTriangle, Loader2, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const QUICK_USERS = [
  { name: 'Dr. Sharma, MD', role: 'Attending Intensivist', email: 'sharma.md@metrohealth.org', color: '#3b82f6', initials: 'DS' },
  { name: 'Nurse Priya, RN', role: 'Primary Bedside BSN', email: 'priya.rn@metrohealth.org', color: '#10b981', initials: 'NP' },
  { name: 'Pharm. Dave', role: 'Clinical Pharmacist', email: 'dave.pharm@metrohealth.org', color: '#8b5cf6', initials: 'PD' },
  { name: 'Admin Elena', role: 'Ward Supervisor', email: 'elena.admin@metrohealth.org', color: '#f59e0b', initials: 'AE' },
];

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [selectedMfa, setSelectedMfa] = useState<'biometric' | 'yubikey' | 'otp'>('biometric');

  const from = (location.state as any)?.from?.pathname || '/';

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      await login(data.email, data.password);
      // Role-based redirect
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role === 'NURSE') navigate('/nurse');
      else if (user.role === 'DOCTOR') navigate('/doctor');
      else if (user.role === 'PHARMACIST') navigate('/prescriptions');
      else navigate('/admin');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Authentication failed. Please check credentials.');
    }
  };

  const quickSwitch = (email: string) => {
    setValue('email', email);
    setValue('password', 'SmartMed@2024');
  };

  return (
    <div className="login-page">
      {/* Top Bar */}
      <div className="top-bar" style={{ justifyContent: 'space-between', paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 13 }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>SmartMedChart</span>
          <span style={{ color: 'var(--color-border-light)', fontSize: 18, lineHeight: 1 }}>|</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Metropolitan General Hospital</span>
          <span style={{ color: 'var(--color-border-light)', fontSize: 18, lineHeight: 1 }}>|</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Ward 4B ICU</span>
          <span style={{ color: 'var(--color-border-light)', fontSize: 18, lineHeight: 1 }}>|</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Shift 07:00–15:00</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
          <span>Station ID: COW-ICU-084</span>
          <span style={{ color: 'var(--color-border)' }}>|</span>
          <span>Gateway: Secure HL7/FHIR Node Active</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: 40 }}>
        {/* Left Panel - Info */}
        <div style={{ maxWidth: 440, flex: 1 }}>
          <div className="card" style={{ padding: 28 }}>
            {/* HIPAA Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 20, padding: '4px 12px', marginBottom: 20 }}>
              <Shield size={12} color="#60a5fa" />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa' }}>HIPAA Level-4 Compliant Session</span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
              Secure Bedside & Ward Authentication
            </h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 24px', lineHeight: 1.6 }}>
              Smarter Medication Management. Safer Patient Care. Authenticate to access real-time eMAR, CPOE verify, and automated 5-Rights medication safety checkpoints.
            </p>

            {/* Active Hospital Context */}
            <div style={{ background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Active Hospital Ward & Facility Context
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 600 }}>
                  Metropolitan General Hospital — Ward 4B ICU
                </span>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-given-green)' }} />
                  <span style={{ color: 'var(--color-given-green)' }}>18 Active Infusions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={12} color="var(--color-stat-red)" />
                  <span style={{ color: 'var(--color-stat-red)', fontWeight: 600 }}>1 STAT CPOE Order</span>
                </div>
              </div>
            </div>

            {/* Quick Clinician Switch */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Quick Clinician Switch (Simulation)
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-accent-blue-light)', cursor: 'pointer' }}>Pre-fills Staff Credential</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {QUICK_USERS.map(u => (
                  <button
                    key={u.email}
                    onClick={() => quickSwitch(u.email)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                      background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)',
                      borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left'
                    }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--color-border-light)')}
                    onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {u.initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{u.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 11, color: 'var(--color-text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Lock size={11} />
                <span>Idle Timeout: 15 min</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Shield size={11} />
                <span>NIST 800-63B Auth</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div style={{ maxWidth: 440, flex: 1 }}>
          <div className="login-card">
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'var(--color-bg-hover)', borderRadius: 8, padding: 4 }}>
              <button style={{ flex: 1, padding: '8px 12px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: 'var(--color-text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Key size={13} />
                Clinical Staff Sign In
              </button>
              <button style={{ flex: 1, padding: '8px 12px', background: 'transparent', border: 'none', borderRadius: 6, color: 'var(--color-text-muted)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Shield size={13} />
                Hospital ID & RFID Badging
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Clinician Staff ID / Hospital SSO Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="input"
                  placeholder="e.g. jsmith.rn@metrohealth.org"
                  autoComplete="username"
                />
                {errors.email && <p style={{ color: 'var(--color-stat-red)', fontSize: 11, marginTop: 4 }}>{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Clinical Passphrase or PIN
                  </label>
                  <span style={{ fontSize: 11, color: 'var(--color-accent-blue-light)', cursor: 'pointer' }}>Reset Ward Credentials?</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="••••••••••••••••"
                    autoComplete="current-password"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p style={{ color: 'var(--color-stat-red)', fontSize: 11, marginTop: 4 }}>{errors.password.message}</p>}
              </div>

              {/* MFA Selection */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Secondary Verification Method (Mandatory for High-Alert Med CPOE)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'biometric', label: 'Biometric Touch', sub: 'Sensor COW-08', icon: Fingerprint },
                    { key: 'yubikey', label: 'YubiKey Token', sub: 'Slot 1 Ready', icon: Key },
                    { key: 'otp', label: 'Hospital Pager OTP', sub: 'Push Notification', icon: Smartphone },
                  ].map(({ key, label, sub, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedMfa(key as any)}
                      style={{
                        padding: '10px 8px', borderRadius: 7, cursor: 'pointer', textAlign: 'center',
                        background: selectedMfa === key ? 'rgba(59,130,246,0.15)' : 'var(--color-bg-hover)',
                        border: `1px solid ${selectedMfa === key ? 'var(--color-accent-blue)' : 'var(--color-border)'}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      <Icon size={18} color={selectedMfa === key ? 'var(--color-accent-blue-light)' : 'var(--color-text-muted)'} style={{ margin: '0 auto 4px' }} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: selectedMfa === key ? 'var(--color-accent-blue-light)' : 'var(--color-text-secondary)' }}>{label}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Session checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <input type="checkbox" id="keep-session" defaultChecked style={{ accentColor: 'var(--color-accent-blue)' }} />
                <label htmlFor="keep-session" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Keep station authenticated for this shift (max 8 hours)
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="alert-critical" style={{ marginBottom: 16, fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={14} />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14, borderRadius: 9 }}
              >
                {isLoading ? (
                  <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Authenticating...</>
                ) : (
                  <><Shield size={16} /> Authenticate & Open Clinical Chart</>
                )}
              </button>

              {/* Emergency Override */}
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={11} color="var(--color-stat-red)" />
                  Urgent Patient Care Protocol:
                </span>
                <span style={{ color: 'var(--color-stat-red)', fontWeight: 700, cursor: 'pointer' }}>Emergency STAT Override (Witness Required)</span>
              </div>
            </form>
          </div>

          {/* Security footer */}
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Lock size={11} />
              <span>256-Bit TLS End-to-End Encrypted Audit Trail</span>
            </div>
            <span>Workstation IP: 10.240.12.89</span>
          </div>
        </div>
      </div>
    </div>
  );
}
