import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Percent, Image, Archive, Layers,
  ChevronLeft, ChevronRight, Boxes,
} from 'lucide-react';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/categories', icon: Layers, label: 'Categories' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/inventory', icon: Archive, label: 'Inventory' },
  { to: '/tags', icon: Tag, label: 'Tags' },
  { to: '/promotions', icon: Percent, label: 'Promotions' },
  { to: '/product-images', icon: Image, label: 'Images' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? 'w-[72px]' : 'w-64'} flex-shrink-0 bg-gray-900/80 backdrop-blur-xl border-r border-gray-800/60 flex flex-col transition-all duration-300 ease-in-out relative`}
      >
        {/* Brand */}
        <div className={`${collapsed ? 'px-3' : 'px-5'} py-5 border-b border-gray-800/60`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <Boxes size={18} className="text-white" />
            </div>
            {!collapsed && (
              <div className="animate-fadeIn">
                <h1 className="text-base font-bold text-white tracking-tight leading-none">ERP Admin</h1>
                <p className="text-[11px] text-gray-500 mt-0.5">Management Console</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'} py-4 space-y-1 overflow-y-auto`}>
          {nav.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                title={collapsed ? label : undefined}
                className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-0 py-2.5' : 'px-3 py-2.5'} rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-r-full" />
                )}
                <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300'} />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="px-3 py-3 border-t border-gray-800/60">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="animate-fadeIn">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
