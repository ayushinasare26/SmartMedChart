import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/api.services';
import { Settings, Plus, Edit, Check, X } from 'lucide-react';

const ROLES = ['DOCTOR', 'NURSE', 'PHARMACIST', 'ADMIN'];
const ROLE_COLORS: Record<string, string> = {
  DOCTOR: '#3b82f6', NURSE: '#10b981', PHARMACIST: '#8b5cf6', ADMIN: '#f59e0b',
};

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'NURSE', staffId: '', ward: '', department: '', password: 'SmartMed@2024' });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: userService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setShowCreate(false);
      setForm({ name: '', email: '', role: 'NURSE', staffId: '', ward: '', department: '', password: 'SmartMed@2024' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => userService.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-users'] }),
  });

  return (
    <div>
      <div className="top-bar">
        <div className="top-bar-section">
          <Settings size={14} color="var(--color-accent-blue-light)" />
          <span style={{ fontWeight: 700, fontSize: 13 }}>Admin — User Management</span>
        </div>
        <div style={{ marginLeft: 'auto', padding: '0 16px' }}>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary" style={{ fontSize: 12 }}>
            <Plus size={13} /> Add User
          </button>
        </div>
      </div>

      <div className="page-content">
        <h1 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)' }}>User Management</h1>

        {/* Create User Form */}
        {showCreate && (
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>Create New User</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { key: 'name', label: 'Full Name', placeholder: 'Dr. John Smith' },
                { key: 'email', label: 'Email', placeholder: 'jsmith@metrohealth.org' },
                { key: 'staffId', label: 'Staff ID', placeholder: 'DR-4001' },
                { key: 'ward', label: 'Ward', placeholder: 'WARD-4B-ICU' },
                { key: 'department', label: 'Department', placeholder: 'ICU Ward 4B' },
                { key: 'password', label: 'Temporary Password', placeholder: 'SmartMed@2024' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{label}</label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="input"
                    placeholder={placeholder}
                    type={key === 'password' ? 'password' : 'text'}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input">
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)} className="btn-ghost" style={{ fontSize: 12 }}><X size={13} /> Cancel</button>
              <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="btn-primary" style={{ fontSize: 12 }}>
                <Check size={13} /> {createMutation.isPending ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="card">
          <table className="audit-table">
            <thead>
              <tr>
                <th>CLINICIAN</th>
                <th>STAFF ID</th>
                <th>ROLE</th>
                <th>WARD / DEPARTMENT</th>
                <th>EMAIL</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>Loading users...</td></tr>
              )}
              {(users as any[]).map((user: any) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: ROLE_COLORS[user.role] || '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{user.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{user.department}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{user.staffId}</td>
                  <td>
                    <span style={{ background: `${ROLE_COLORS[user.role]}20`, color: ROLE_COLORS[user.role], border: `1px solid ${ROLE_COLORS[user.role]}40`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{user.ward || '—'}</td>
                  <td style={{ fontSize: 12 }}>{user.email}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: user.isActive ? 'var(--color-given-green)' : 'var(--color-text-muted)', fontWeight: 600 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: user.isActive ? 'var(--color-given-green)' : 'var(--color-text-muted)' }} />
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleMutation.mutate({ id: user.id, isActive: !user.isActive })}
                      className="btn-ghost"
                      style={{ fontSize: 11, padding: '4px 10px', color: user.isActive ? 'var(--color-stat-red)' : 'var(--color-given-green)' }}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
