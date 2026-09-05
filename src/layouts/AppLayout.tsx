import { Sidebar } from '../components/Sidebar';
import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="main-layout">
        <Outlet />
      </div>
    </div>
  );
}
