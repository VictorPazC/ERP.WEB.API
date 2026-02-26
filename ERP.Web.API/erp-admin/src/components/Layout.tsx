import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Percent, Image, Archive, Layers,
  ChevronLeft, ChevronRight, Boxes, Menu, X, Sun, Moon, Users, ShoppingBag,
  ShoppingCart, Shield, Eye, LogOut,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/categories', icon: Layers, label: 'Categories' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/inventory', icon: Archive, label: 'Inventory' },
  { to: '/articulos', icon: ShoppingBag, label: 'Articulos' },
  { to: '/consumptions', icon: ShoppingCart, label: 'Consumptions' },
  { to: '/tags', icon: Tag, label: 'Tags' },
  { to: '/promotions', icon: Percent, label: 'Promotions' },
  { to: '/product-images', icon: Image, label: 'Images' },
  { to: '/users', icon: Users, label: 'Users' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const { user, logout, isAdmin } = useUser();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const sidebarContent = (isMobile: boolean) => (
    <>
      <div className={`${!isMobile && collapsed ? 'px-3' : 'px-5'} py-5 border-b border-gray-200 dark:border-gray-800/60`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <Boxes size={18} className="text-white" />
          </div>
          {(isMobile || !collapsed) && (
            <div className="animate-fadeIn flex-1">
              <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-tight leading-none">ERP Admin</h1>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Management Console</p>
            </div>
          )}
          {isMobile && (
            <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ml-auto">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <nav className={`flex-1 ${!isMobile && collapsed ? 'px-2' : 'px-3'} py-4 space-y-1 overflow-y-auto`}>
        {nav.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={!isMobile && collapsed ? label : undefined}
              className={`flex items-center ${!isMobile && collapsed ? 'justify-center' : ''} gap-3 ${!isMobile && collapsed ? 'px-0 py-2.5' : 'px-3 py-2.5'} rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-r-full" />
              )}
              <Icon size={18} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'} />
              {(isMobile || !collapsed) && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800/60 space-y-1">
        {/* User info */}
        {(isMobile || !collapsed) && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isAdmin ? 'bg-indigo-500/15 ring-1 ring-indigo-500/30' : 'bg-gray-200 dark:bg-gray-800 ring-1 ring-gray-300 dark:ring-gray-700'}`}>
              {isAdmin
                ? <Shield size={13} className="text-indigo-500 dark:text-indigo-400" />
                : <Eye size={13} className="text-gray-500 dark:text-gray-400" />
              }
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-600">{isAdmin ? 'Admin — full access' : 'Viewer — read only'}</p>
            </div>
          </div>
        )}

        <button
          onClick={toggle}
          className={`w-full flex items-center ${!isMobile && collapsed ? 'justify-center' : ''} gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {(isMobile || !collapsed) && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <button
          onClick={logout}
          className={`w-full flex items-center ${!isMobile && collapsed ? 'justify-center' : ''} gap-2 px-3 py-2 rounded-xl text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors`}
          title={!isMobile && collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut size={16} />
          {(isMobile || !collapsed) && <span>Cerrar sesión</span>}
        </button>

        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <aside
        className={`${collapsed ? 'w-[72px]' : 'w-64'} flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800/60 flex-col transition-all duration-300 ease-in-out relative hidden lg:flex`}
      >
        {sidebarContent(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800/60 flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {sidebarContent(true)}
      </aside>

      <main className="flex-1 overflow-auto min-w-0">
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800/60 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Boxes size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">ERP Admin</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${isAdmin ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
              {isAdmin ? <Shield size={12} /> : <Eye size={12} />}
              {user.name}
            </div>
            <button onClick={toggle} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={logout} className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <div className="animate-fadeIn">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
