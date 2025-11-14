import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  House,
  BoxSeam,
  ListColumns,
  Cart4,
  People,
  GraphUp,
  Gear
} from 'react-bootstrap-icons';
import '../styles.css';

type NavItem = {
  to: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', Icon: House },
  { to: '/products', label: 'Products', Icon: BoxSeam },
  { to: '/inventory', label: 'Inventory', Icon: ListColumns },
  { to: '/billing', label: 'Billing', Icon: Cart4 },
  { to: '/customers', label: 'Customers', Icon: People },
  { to: '/reports', label: 'Reports', Icon: GraphUp },
  { to: '/admin', label: 'Admin', Icon: Gear },
];

const Sidebar: React.FC<{ onSidebarClassChange?: (c: string) => void }> = ({ onSidebarClassChange }) => {
  const [collapsed] = useState(true);
  const [hovered, setHovered] = useState(false);
  const isExpanded = !collapsed || hovered;

  // Sync with context if provided
  useEffect(() => {
    if (onSidebarClassChange) {
      onSidebarClassChange(isExpanded ? '' : 'collapsed');
    }
  }, [isExpanded, onSidebarClassChange]);

  return (
    <aside
      className={`app-sidebar${isExpanded ? '' : ' collapsed'}`}
      aria-label="Main navigation"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="sidebar-top d-flex align-items-center justify-content-between px-2">
        <div className="brand d-flex align-items-center gap-2">
          <div
            className="brand-icon rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
            style={{ width: 36, height: 36 }}
          >
            MS
          </div>
          {isExpanded && <div className="brand-text fw-bold">MyShop</div>}
        </div>

        {/* <button
          className="btn btn-sm btn-outline-secondary sidebar-toggle"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          ☰
        </button> */}
      </div>

      <nav className="nav flex-column mt-3 px-1" role="navigation">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
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
        <div className="small text-muted text-center">
          {isExpanded ? <>Logged in as <strong>Admin</strong></> : 'A'}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
