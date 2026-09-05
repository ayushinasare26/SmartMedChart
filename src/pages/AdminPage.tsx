import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userService } from '../services/api.services';
import { useAuth } from '../hooks/useAuth';
import {
  Shield, UserCheck, Stethoscope, Briefcase, Plus, Search,
  LogIn, User, Award, CheckCircle2, XCircle, Clock,
  ExternalLink, LogOut, Check, X, AlertCircle, RefreshCw,
  QrCode, UserPlus, FileText, ChevronRight, Activity, Building2,
  SlidersHorizontal, HeartPulse, Pill, FlaskConical, Eye
} from 'lucide-react';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'ADMIN' | 'OTHER_STAFF';
  staffId: string;
  ward?: string;
  department?: string;
  title?: string;
  specialty?: string;
  licenseNumber?: string;
  shiftType?: string;
  onDuty?: boolean;
  avatarUrl?: string;
  isActive?: boolean;
}

export default function AdminPage() {
  const { user: currentUser, logout, impersonate } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'OTHER_STAFF' | 'ADMIN'>('ALL');

  // Modals
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [badgeModalUser, setBadgeModalUser] = useState<StaffUser | null>(null);

  // Auto-open enroll modal if ?enroll=true in URL
  useEffect(() => {
    if (searchParams.get('enroll') === 'true') {
      setShowEnrollModal(true);
    }
  }, [searchParams]);

  // Form State for Enrollment
  const [enrollForm, setEnrollForm] = useState({
    name: '',
    email: '',
    role: 'DOCTOR',
    staffId: '',
    department: 'Cardiology & Intensive Care',
    ward: 'Ward 4B ICU',
    title: 'Consultant Specialist',
    specialty: 'Cardiovascular Medicine',
    licenseNumber: 'MD-77821-US',
    shiftType: 'MORNING',
    onDuty: true,
    pin: '1234',
    password: 'SmartMed@2024'
  });

  // Fetch all staff users
  const { data: staffList = [], isLoading, refetch } = useQuery<StaffUser[]>({
    queryKey: ['all-staff-users'],
    queryFn: () => userService.getAll(),
  });

  // Mutations
  const enrollMutation = useMutation({
    mutationFn: (data: any) => userService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-staff-users'] });
      setShowEnrollModal(false);
      resetEnrollForm();
    }
  });

  const dutyMutation = useMutation({
    mutationFn: (id: string) => userService.toggleDuty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-staff-users'] });
    }
  });

  const resetEnrollForm = (presetRole = 'DOCTOR') => {
    const isDoc = presetRole === 'DOCTOR';
    const isNurse = presetRole === 'NURSE';
    const isPharm = presetRole === 'PHARMACIST';
    const isAllied = presetRole === 'OTHER_STAFF';

    setEnrollForm({
      name: '',
      email: '',
      role: presetRole,
      staffId: isDoc ? `DOC-${Math.floor(10000 + Math.random() * 90000)}` :
               isNurse ? `RN-${Math.floor(10000 + Math.random() * 90000)}` :
               isPharm ? `PH-${Math.floor(10000 + Math.random() * 90000)}` :
               isAllied ? `LT-${Math.floor(10000 + Math.random() * 90000)}` :
               `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
      department: isDoc ? 'Cardiology & General Medicine' :
                  isNurse ? 'Ward 4B (Acute Inpatient)' :
                  isPharm ? 'Clinical Pharmacy Services' :
                  isAllied ? 'Central Pathology & Blood Bank' : 'Hospital Operations Bureau',
      ward: 'Ward 4B ICU',
      title: isDoc ? 'Consultant Physician' :
             isNurse ? 'Staff Registered Nurse' :
             isPharm ? 'Clinical Pharmacist' :
             isAllied ? 'Senior Biomedical Technologist' : 'Administrator',
      specialty: isDoc ? 'Internal Medicine & Geriatrics' :
                 isNurse ? 'Inpatient Acute Care & eMAR' :
                 isPharm ? 'Pharmacotherapy & Medication Safety' :
                 isAllied ? 'Hematology & Diagnostics' : 'Clinical Logistics',
      licenseNumber: isDoc ? `MD-${Math.floor(10000 + Math.random() * 90000)}-CA` :
                     isNurse ? `RN-${Math.floor(10000 + Math.random() * 90000)}-UK` :
                     isPharm ? `RPH-${Math.floor(10000 + Math.random() * 90000)}-GB` :
                     isAllied ? `MLS-${Math.floor(10000 + Math.random() * 90000)}-ASCP` : `HOSP-ADM-${Math.floor(1000 + Math.random() * 9000)}`,
      shiftType: 'MORNING',
      onDuty: true,
      pin: '1234',
      password: 'SmartMed@2024'
    });
  };

  const handleOpenEnrollModal = (presetRole = 'DOCTOR') => {
    resetEnrollForm(presetRole);
    setShowEnrollModal(true);
  };

  // Impersonate / Launch Workstation
  const handleImpersonate = async (targetUser: StaffUser) => {
    try {
      await impersonate(targetUser.id, targetUser.staffId);
      // Route based on role
      if (targetUser.role === 'DOCTOR') {
        navigate('/doctor');
      } else if (targetUser.role === 'NURSE') {
        navigate('/nurse');
      } else if (targetUser.role === 'PHARMACIST') {
        navigate('/prescriptions');
      } else {
        navigate('/patients');
      }
    } catch (err: any) {
      alert('Simulation sign-in failed: ' + (err?.response?.data?.message || err.message));
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = staffList.length;
    const onDutyCount = staffList.filter(u => u.onDuty).length;
    const doctors = staffList.filter(u => u.role === 'DOCTOR').length;
    const nurses = staffList.filter(u => u.role === 'NURSE').length;
    const pharmacists = staffList.filter(u => u.role === 'PHARMACIST').length;
    const allied = staffList.filter(u => u.role === 'OTHER_STAFF').length;
    const admins = staffList.filter(u => u.role === 'ADMIN').length;

    return { total, onDutyCount, doctors, nurses, pharmacists, allied, admins };
  }, [staffList]);

  // Filtered staff members
  const filteredStaff = useMemo(() => {
    return staffList.filter(staff => {
      // Role filter
      if (roleFilter !== 'ALL' && staff.role !== roleFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = staff.name?.toLowerCase().includes(q);
        const matchBadge = staff.staffId?.toLowerCase().includes(q);
        const matchDept = staff.department?.toLowerCase().includes(q);
        const matchLicense = staff.licenseNumber?.toLowerCase().includes(q);
        const matchTitle = staff.title?.toLowerCase().includes(q);
        if (!matchName && !matchBadge && !matchDept && !matchLicense && !matchTitle) {
          return false;
        }
      }
      return true;
    });
  }, [staffList, roleFilter, searchQuery]);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* ======================================================== */}
      {/* 1. TOP PORTAL NAVIGATION BAR                             */}
      {/* ======================================================== */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Brand & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0b4da2 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 10px rgba(11, 77, 162, 0.25)'
          }}>
            <Shield size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                SmartMedAdmin
              </span>
              <span style={{
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 9999,
                letterSpacing: '0.06em'
              }}>
                ROOT GOVERNANCE
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Hospital Staff Enrollment &amp; Clinical Directory Control Portal
            </div>
          </div>
        </div>

        {/* Right Actions: eMAR Link & Admin User Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Enter SmartMedChart eMAR Button */}
          <button
            onClick={() => navigate('/patients')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              backgroundColor: '#0b4da2',
              color: '#ffffff',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(11, 77, 162, 0.25)',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#093f85')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0b4da2')}
          >
            <ExternalLink size={14} />
            <span>Enter SmartMedChart eMAR</span>
          </button>

          {/* User Profile Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '4px 12px 4px 6px',
            backgroundColor: '#f1f5f9',
            borderRadius: 9999,
            border: '1px solid #e2e8f0'
          }}>
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150'}
              alt="Admin Avatar"
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {currentUser?.name || 'Dr. Evelyn Vance, MD'}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1 }}>
                {currentUser?.staffId || 'ADM-9001'} &bull; Admin
              </div>
            </div>
            <button
              onClick={() => logout().then(() => navigate('/login'))}
              title="Sign Out"
              style={{
                marginLeft: 4,
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 28px' }}>
        {/* ======================================================== */}
        {/* 2. HERO GREETING BANNER (Dark Navy)                      */}
        {/* ======================================================== */}
        <div style={{
          backgroundColor: '#0c1a30',
          backgroundImage: 'linear-gradient(135deg, #0c1a30 0%, #0e274c 100%)',
          borderRadius: 16,
          padding: '28px 32px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          boxShadow: '0 10px 25px -5px rgba(12, 26, 48, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.08em',
                padding: '3px 10px',
                borderRadius: 9999,
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                HOSPITAL ADMINISTRATION BUREAU
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Welcome, {currentUser?.name || 'Dr. Evelyn Vance, MD'}
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, maxWidth: 620, lineHeight: 1.5 }}>
              Authorize, credential, and onboard new hospital doctors, nurses, pharmacists, and allied diagnostic staff into the hospital's central clinical directory.
            </p>
          </div>

          {/* 4 Fast Enrollment Buttons in Banner */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              onClick={() => handleOpenEnrollModal('DOCTOR')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 15px',
                borderRadius: 9,
                backgroundColor: '#ffffff',
                color: '#0b4da2',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'all 0.15s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <UserPlus size={15} />
              <span>Enroll Doctor</span>
            </button>

            <button
              onClick={() => handleOpenEnrollModal('NURSE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 15px',
                borderRadius: 9,
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.15s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Plus size={15} />
              <span>Enroll Nurse</span>
            </button>

            <button
              onClick={() => handleOpenEnrollModal('PHARMACIST')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 15px',
                borderRadius: 9,
                backgroundColor: '#0d9488',
                color: '#ffffff',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(13, 148, 136, 0.3)',
                transition: 'all 0.15s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Plus size={15} />
              <span>Enroll Pharmacist</span>
            </button>

            <button
              onClick={() => handleOpenEnrollModal('OTHER_STAFF')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 15px',
                borderRadius: 9,
                backgroundColor: '#7c3aed',
                backgroundImage: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)',
                transition: 'all 0.15s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <FlaskConical size={15} />
              <span>BIOMEDICAL &bull; Other Staff</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. SIX METRIC KPI CARDS                                  */}
        {/* ======================================================== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 14,
          marginBottom: 24
        }}>
          {/* Total Staff */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: '16px 18px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>TOTAL STAFF</span>
              <User size={15} color="#64748b" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              {stats.total}
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              color: '#16a34a',
              backgroundColor: '#f0fdf4',
              padding: '2px 8px',
              borderRadius: 6
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a' }} />
              {stats.onDutyCount} On Duty
            </div>
          </div>

          {/* Doctors */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: '16px 18px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>DOCTORS</span>
              <Stethoscope size={15} color="#2563eb" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb', marginBottom: 6 }}>
              {stats.doctors}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
              Active Prescribers
            </div>
          </div>

          {/* Nurses */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: '16px 18px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>NURSES (RN)</span>
              <HeartPulse size={15} color="#10b981" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginBottom: 6 }}>
              {stats.nurses}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
              eMAR Verified
            </div>
          </div>

          {/* Pharmacists */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: '16px 18px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>PHARMACISTS</span>
              <Pill size={15} color="#0d9488" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0d9488', marginBottom: 6 }}>
              {stats.pharmacists}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
              Dispensary Leads
            </div>
          </div>

          {/* Allied / Biomedical */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: '16px 18px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>ALLIED / BIOMED</span>
              <FlaskConical size={15} color="#7c3aed" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed', marginBottom: 6 }}>
              {stats.allied}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
              Lab &amp; Diagnostics
            </div>
          </div>

          {/* Bed Capacity */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: '16px 18px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>BED CAPACITY</span>
              <Building2 size={15} color="#f59e0b" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              28/32
            </div>
            <div style={{ fontSize: 11, color: '#d97706', fontWeight: 700 }}>
              87.5% Occupancy
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. FOUR ENROLLMENT QUICK ACTION CARDS                    */}
        {/* ======================================================== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 28
        }}>
          {/* Card 1: Doctor */}
          <div
            onClick={() => handleOpenEnrollModal('DOCTOR')}
            style={{
              backgroundColor: '#f0f7ff',
              border: '1px solid #bfdbfe',
              borderRadius: 14,
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#bfdbfe')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                backgroundColor: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Stethoscope size={18} />
              </div>
              <ChevronRight size={18} color="#2563eb" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
              Enroll Doctor
            </div>
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.45, marginBottom: 14 }}>
              Medical license (GMC/NPI), specialty, e-prescribing clearance, and badge.
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4 }}>
              Add Physician <span>&oplus;</span>
            </div>
          </div>

          {/* Card 2: Nurse */}
          <div
            onClick={() => handleOpenEnrollModal('NURSE')}
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 14,
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#16a34a')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#bbf7d0')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                backgroundColor: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <HeartPulse size={18} />
              </div>
              <ChevronRight size={18} color="#16a34a" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
              Enroll Nurse / RN
            </div>
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.45, marginBottom: 14 }}>
              Nursing license, shift schedule, ward assignment, and 5-rights admin rights.
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
              Add Nursing Staff <span>&oplus;</span>
            </div>
          </div>

          {/* Card 3: Pharmacist */}
          <div
            onClick={() => handleOpenEnrollModal('PHARMACIST')}
            style={{
              backgroundColor: '#f0fdfa',
              border: '1px solid #99f6e4',
              borderRadius: 14,
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#0d9488')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#99f6e4')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                backgroundColor: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Pill size={18} />
              </div>
              <ChevronRight size={18} color="#0d9488" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
              Enroll Pharmacist
            </div>
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.45, marginBottom: 14 }}>
              Pharmacy board (RPh), dispensary vault access, and verification clearance.
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0d9488', display: 'flex', alignItems: 'center', gap: 4 }}>
              Add Pharmacist <span>&oplus;</span>
            </div>
          </div>

          {/* Card 4: Other Staff / Biomedical */}
          <div
            onClick={() => handleOpenEnrollModal('OTHER_STAFF')}
            style={{
              backgroundColor: '#faf5ff',
              border: '1px solid #e9d5ff',
              borderRadius: 14,
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#9333ea')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#e9d5ff')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                backgroundColor: '#9333ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <FlaskConical size={18} />
              </div>
              <ChevronRight size={18} color="#9333ea" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
              Enroll Other Staff
            </div>
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.45, marginBottom: 14 }}>
              Lab technologists, radiographers, phlebotomists, and ward coordinators.
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9333ea', display: 'flex', alignItems: 'center', gap: 4 }}>
              Add Allied Staff <span>&oplus;</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. HOSPITAL PERSONNEL & STAFF DIRECTORY TABLE            */}
        {/* ======================================================== */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}>
          {/* Section Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Hospital Personnel &amp; Staff Directory
                </h2>
                <span style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 9999
                }}>
                  {filteredStaff.length} Members
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
                Manage active clinicians, toggle shift statuses, inspect digital badges, or launch workstation as staff.
              </p>
            </div>

            <button
              onClick={() => handleOpenEnrollModal('DOCTOR')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 9,
                backgroundColor: '#0b4da2',
                color: '#ffffff',
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(11, 77, 162, 0.25)'
              }}
            >
              <UserPlus size={16} />
              <span>Enroll New Staff</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{
            padding: '14px 24px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: 380, maxWidth: '100%' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, badge ID, license, or department..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  fontSize: 12,
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 8,
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: `All Staff (${stats.total})` },
                { id: 'DOCTOR', label: `Doctors (${stats.doctors})` },
                { id: 'NURSE', label: `Nurses (${stats.nurses})` },
                { id: 'PHARMACIST', label: `Pharmacists (${stats.pharmacists})` },
                { id: 'OTHER_STAFF', label: `Allied Staff (${stats.allied})` },
                { id: 'ADMIN', label: `Admin (${stats.admins})` },
              ].map((tab) => {
                const isActive = roleFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setRoleFilter(tab.id as any)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 9999,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: isActive ? '#0f172a' : '#e2e8f0',
                      backgroundColor: isActive ? '#0f172a' : '#ffffff',
                      color: isActive ? '#ffffff' : '#64748b',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Directory Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em' }}>
                  <th style={{ padding: '12px 24px' }}>STAFF MEMBER</th>
                  <th style={{ padding: '12px 18px' }}>ROLE &amp; BADGE ID</th>
                  <th style={{ padding: '12px 18px' }}>DEPARTMENT &amp; SPECIALTY</th>
                  <th style={{ padding: '12px 18px' }}>LICENSE / CREDENTIALS</th>
                  <th style={{ padding: '12px 18px' }}>SHIFT &amp; DUTY STATUS</th>
                  <th style={{ padding: '12px 24px', textAlign: 'right' }}>ACTIONS &amp; WORKSTATION</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                      <div>Loading hospital directory...</div>
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                      <AlertCircle size={24} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
                      <div style={{ fontWeight: 600 }}>No personnel matching filter criteria.</div>
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff, idx) => {
                    const isDoc = staff.role === 'DOCTOR';
                    const isNurse = staff.role === 'NURSE';
                    const isPharm = staff.role === 'PHARMACIST';
                    const isAllied = staff.role === 'OTHER_STAFF';
                    const isAdmin = staff.role === 'ADMIN';

                    return (
                      <tr
                        key={staff.id || staff.staffId}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#fafafa')}
                      >
                        {/* 1. Staff Member */}
                        <td style={{ padding: '14px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img
                              src={staff.avatarUrl || `https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150`}
                              alt={staff.name}
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1.5px solid #e2e8f0',
                                flexShrink: 0
                              }}
                            />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                {staff.name}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                {staff.title || staff.role}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Role & Badge ID */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                            {isDoc && (
                              <span style={{
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                fontSize: 10,
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                <Stethoscope size={11} /> DOCTOR
                              </span>
                            )}
                            {isNurse && (
                              <span style={{
                                backgroundColor: '#f0fdf4',
                                color: '#15803d',
                                border: '1px solid #bbf7d0',
                                fontSize: 10,
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                <HeartPulse size={11} /> NURSE
                              </span>
                            )}
                            {isPharm && (
                              <span style={{
                                backgroundColor: '#f0fdfa',
                                color: '#0f766e',
                                border: '1px solid #99f6e4',
                                fontSize: 10,
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                <Pill size={11} /> PHARMACIST
                              </span>
                            )}
                            {isAllied && (
                              <span style={{
                                backgroundColor: '#faf5ff',
                                color: '#7e22ce',
                                border: '1px solid #e9d5ff',
                                fontSize: 10,
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                <FlaskConical size={11} /> BIOMEDICAL
                              </span>
                            )}
                            {isAdmin && (
                              <span style={{
                                backgroundColor: '#0f172a',
                                color: '#ffffff',
                                fontSize: 10,
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                <Shield size={11} /> ADMIN
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', fontWeight: 600 }}>
                            {staff.staffId}
                          </div>
                        </td>

                        {/* 3. Department & Specialty */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                            {staff.department || 'Ward 4B ICU'}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {staff.specialty || 'General Care & eMAR'}
                          </div>
                        </td>

                        {/* 4. License / Credentials */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                            {staff.licenseNumber || 'VERIFIED-ACTIVE'}
                          </div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>
                            PIN: &bull;&bull;&bull;&bull;
                          </div>
                        </td>

                        {/* 5. Shift & Duty Status */}
                        <td style={{ padding: '14px 18px' }}>
                          <button
                            onClick={() => dutyMutation.mutate(staff.id)}
                            title="Click to toggle Shift Duty"
                            style={{
                              border: 'none',
                              background: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 3
                            }}
                          >
                            {staff.onDuty ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: 11,
                                fontWeight: 800,
                                color: '#16a34a',
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                padding: '2px 8px',
                                borderRadius: 9999
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a' }} />
                                ON DUTY
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#64748b',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                padding: '2px 8px',
                                borderRadius: 9999
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#94a3b8' }} />
                                ACTIVE (OFF-DUTY)
                              </span>
                            )}
                          </button>
                          <div style={{ fontSize: 10, color: '#64748b' }}>
                            Shift: {staff.shiftType || 'MORNING'}
                          </div>
                        </td>

                        {/* 6. Actions & Workstation */}
                        <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {/* Log In As Clinician Button */}
                            <button
                              onClick={() => handleImpersonate(staff)}
                              title={`Log in as ${staff.name}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                borderRadius: 7,
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = '#1d4ed8';
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#eff6ff';
                                e.currentTarget.style.color = '#1d4ed8';
                              }}
                            >
                              <LogIn size={13} />
                              <span>Log In As</span>
                            </button>

                            {/* View Badge */}
                            <button
                              onClick={() => setBadgeModalUser(staff)}
                              title="Inspect Hospital Digital Badge"
                              style={{
                                padding: 6,
                                borderRadius: 7,
                                border: '1px solid #e2e8f0',
                                backgroundColor: '#ffffff',
                                color: '#64748b',
                                cursor: 'pointer'
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.color = '#0f172a')}
                              onMouseOut={(e) => (e.currentTarget.style.color = '#64748b')}
                            >
                              <QrCode size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* 6. ENROLL NEW STAFF MODAL                                */}
      {/* ======================================================== */}
      {showEnrollModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 18,
            width: '100%',
            maxWidth: 620,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserPlus size={18} color="#0b4da2" />
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Enroll New Hospital Personnel
                  </h3>
                </div>
                <p style={{ fontSize: 11, color: '#64748b', margin: '3px 0 0' }}>
                  Register clinical credentials, assign ward privileges, and generate eMAR badging.
                </p>
              </div>
              <button
                onClick={() => setShowEnrollModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              enrollMutation.mutate(enrollForm);
            }}>
              <div style={{ padding: '20px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
                {/* Role Tabs inside Modal */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                    SELECT CLINICAL ROLE CATEGORY:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                      { role: 'DOCTOR', label: 'Doctor / MD', icon: Stethoscope },
                      { role: 'NURSE', label: 'Nurse / RN', icon: HeartPulse },
                      { role: 'PHARMACIST', label: 'Pharmacist', icon: Pill },
                      { role: 'OTHER_STAFF', label: 'Biomedical / Allied', icon: FlaskConical },
                    ].map(({ role, label, icon: Icon }) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => resetEnrollForm(role)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: 8,
                          border: `1.5px solid ${enrollForm.role === role ? '#0b4da2' : '#e2e8f0'}`,
                          backgroundColor: enrollForm.role === role ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <Icon size={16} color={enrollForm.role === role ? '#0b4da2' : '#64748b'} style={{ margin: '0 auto 4px' }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: enrollForm.role === role ? '#0b4da2' : '#334155' }}>
                          {label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Full Name &amp; Degree Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Julian Croft, MD"
                      value={enrollForm.name}
                      onChange={(e) => setEnrollForm({ ...enrollForm, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: 12,
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 8,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Staff ID / Badge */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Hospital Badge ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={enrollForm.staffId}
                      onChange={(e) => setEnrollForm({ ...enrollForm, staffId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: 12,
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 8,
                        fontFamily: 'monospace',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* SSO Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Hospital SSO Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. jcroft.md@metrohealth.org"
                      value={enrollForm.email}
                      onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: 12,
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 8,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Medical License # */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      State / GMC License Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={enrollForm.licenseNumber}
                      onChange={(e) => setEnrollForm({ ...enrollForm, licenseNumber: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: 12,
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 8,
                        fontFamily: 'monospace',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Hospital Department *
                    </label>
                    <input
                      type="text"
                      required
                      value={enrollForm.department}
                      onChange={(e) => setEnrollForm({ ...enrollForm, department: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: 12,
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 8,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Specialty */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Clinical Specialty / Subspecialty
                    </label>
                    <input
                      type="text"
                      value={enrollForm.specialty}
                      onChange={(e) => setEnrollForm({ ...enrollForm, specialty: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: 12,
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 8,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Shift Type */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Duty Shift Schedule
                    </label>
                    <select
                      value={enrollForm.shiftType}
                      onChange={(e) => setEnrollForm({ ...enrollForm, shiftType: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: 12,
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 8,
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="MORNING">Morning Shift (07:00 – 15:00)</option>
                      <option value="EVENING">Evening Shift (15:00 – 23:00)</option>
                      <option value="NIGHT">Night Shift (23:00 – 07:00)</option>
                      <option value="ROTATING">Rotating 12h Shift</option>
                    </select>
                  </div>

                  {/* Security PIN */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Default Station PIN (4-Digits)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={enrollForm.pin}
                      onChange={(e) => setEnrollForm({ ...enrollForm, pin: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: 12,
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 8,
                        letterSpacing: '0.15em',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Duty Toggle */}
                <div style={{ marginTop: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={enrollForm.onDuty}
                      onChange={(e) => setEnrollForm({ ...enrollForm, onDuty: e.target.checked })}
                      style={{ accentColor: '#16a34a' }}
                    />
                    <span>Mark as currently <strong>ON DUTY</strong> on hospital roster</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #f1f5f9',
                backgroundColor: '#f8fafc',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10
              }}>
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollMutation.isPending}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#0b4da2',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(11, 77, 162, 0.25)'
                  }}
                >
                  {enrollMutation.isPending ? 'Enrolling Clinician...' : 'Complete Enrollment & Authorize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. DIGITAL SMART BADGE MODAL                             */}
      {/* ======================================================== */}
      {badgeModalUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 20,
            width: 320,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            border: '2px solid #0f172a',
            position: 'relative'
          }}>
            {/* Lanyard Hole */}
            <div style={{
              width: 50,
              height: 10,
              backgroundColor: '#0f172a',
              borderRadius: 6,
              margin: '12px auto 0'
            }} />

            <div style={{ padding: '16px 20px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', letterSpacing: '0.04em' }}>
                METROPOLITAN GENERAL
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', marginBottom: 14 }}>
                CLINICAL SMART BADGE &bull; RFID PASS
              </div>

              <img
                src={badgeModalUser.avatarUrl || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150'}
                alt={badgeModalUser.name}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 14,
                  objectFit: 'cover',
                  border: '3px solid #0f172a',
                  margin: '0 auto 12px'
                }}
              />

              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                {badgeModalUser.name}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', marginBottom: 8 }}>
                {badgeModalUser.title || badgeModalUser.role}
              </div>

              <div style={{
                backgroundColor: '#f1f5f9',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 10,
                textAlign: 'left',
                marginBottom: 14
              }}>
                <div><strong>BADGE ID:</strong> <span style={{ fontFamily: 'monospace' }}>{badgeModalUser.staffId}</span></div>
                <div><strong>DEPT:</strong> {badgeModalUser.department}</div>
                <div><strong>LICENSE:</strong> <span style={{ fontFamily: 'monospace' }}>{badgeModalUser.licenseNumber}</span></div>
                <div><strong>CLEARANCE:</strong> LEVEL 3 CLINICAL eMAR</div>
              </div>

              {/* Barcode Mock */}
              <div style={{
                height: 34,
                backgroundColor: '#0f172a',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontFamily: 'monospace',
                fontSize: 10,
                letterSpacing: '0.3em'
              }}>
                ||||| | |||| ||| || ||||
              </div>

              <button
                onClick={() => setBadgeModalUser(null)}
                style={{
                  marginTop: 16,
                  width: '100%',
                  padding: '8px',
                  borderRadius: 8,
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Badge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
