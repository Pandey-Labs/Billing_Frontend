import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../store/hooks';
import type { RootState } from '../store/store';
import {
  House,
  BoxSeam,
  ListColumns,
  Cart4,
  People,
  PeopleFill,
  GraphUp,
  Gear,
  BoxArrowRight
} from 'react-bootstrap-icons';
import { logout } from '../slices/authSlice';
import { toast } from '../utils/toast';
import '../styles.css';

type NavItem = {
  to: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  permissionKey?: string;
};

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', Icon: House, permissionKey: 'dashboard' },
  { to: '/products', label: 'Products', Icon: BoxSeam, permissionKey: 'products' },
  { to: '/inventory', label: 'Inventory', Icon: ListColumns, permissionKey: 'products' },
  { to: '/billing', label: 'Billing', Icon: Cart4, permissionKey: 'billing' },
  { to: '/billing-history', label: 'Billing History', Icon: ListColumns, permissionKey: 'billing' },
  { to: '/customers', label: 'Customers', Icon: People, permissionKey: 'customers' },
  { to: '/reports', label: 'Reports', Icon: GraphUp, permissionKey: 'reports' },
  { to: '/settings', label: 'Settings', Icon: Gear, permissionKey: 'settings' },
  // { to: '/admin', label: 'Admin', Icon: Gear, permissionKey: 'admin' },
  { to: '/admin/staff', label: 'Staff Management', Icon: PeopleFill, permissionKey: 'admin' },
];


const Sidebar: React.FC<{ onSidebarClassChange?: (c: string) => void }> = ({ onSidebarClassChange }) => {
  const [collapsed] = useState(true);
  const [hovered, setHovered] = useState(false);
  const isExpanded = !collapsed || hovered;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s: RootState) => s.auth.user);

  const role = String(user?.role || '').toLowerCase();
  const permissions = Array.isArray(user?.permissions) ? user!.permissions! : [];

  const roleLabel = (() => {
    if (role === 'admin') return 'Admin';
    if (role === 'staffadmin') return 'Staff Admin';
    if (role === 'staff') return 'Staff';
    return 'User';
  })();

  const visibleItems = role === 'admin'
    ? NAV_ITEMS
    : NAV_ITEMS.filter((it) => !it.permissionKey || permissions.includes(it.permissionKey));

  // Sync with context if provided
  useEffect(() => {
    if (onSidebarClassChange) {
      onSidebarClassChange(isExpanded ? '' : 'collapsed');
    }
  }, [isExpanded, onSidebarClassChange]);

  const handleLogout = () => {
    dispatch(logout());
    toast.info('Logged out successfully');
    navigate('/');
  };

  return (
    <aside
      className={`app-sidebar${isExpanded ? '' : ' collapsed'}`}
      aria-label="Main navigation"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <nav className="nav flex-column mt-3 px-1" role="navigation">
        {visibleItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-link d-flex align-items-center gap-3 py-2 px-2 rounded ${
                isActive ? 'active' : 'text-secondary'
              }`
            }
          >
            <span className="icon-wrap d-flex align-items-center justify-content-center">
              <Icon width={18} height={18} />
            </span>
            {isExpanded && <span className="link-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer mt-auto px-2 pb-3">
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 py-2"
          style={{
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            borderColor: '#dc3545',
            color: '#dc3545',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dc3545';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#dc3545';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          title="Logout"
        >
          <BoxArrowRight size={18} />
          {isExpanded && <span>Logout</span>}
        </button>
        {isExpanded && (
          <div className="small text-muted text-center mt-2">
            Logged in as <strong>{roleLabel}</strong>
        </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
