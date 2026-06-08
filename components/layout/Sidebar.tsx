'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { href: '/', icon: '⊞', label: 'דשבורד' },
  { href: '/projects', icon: '📁', label: 'פרויקטים' },
  { href: '/settings', icon: '⚙️', label: 'הגדרות' },
];

export default function Sidebar({ businessName }: { businessName?: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-[#1e3a5f] text-white transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'} min-h-screen shrink-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          {!collapsed && (
            <div>
              <p className="font-bold text-sm leading-tight">{businessName || 'מנהל פרויקטים'}</p>
              <p className="text-blue-300 text-xs mt-0.5">🏗️ בינוי ותשתיות</p>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white text-sm">
            {collapsed ? '»' : '«'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-sm font-medium ${active ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                <span className="text-base shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-white/10">
            <p className="text-white/40 text-xs">v2.0</p>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1e3a5f] text-white flex z-50 border-t border-white/10">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs transition ${active ? 'text-white' : 'text-white/50'}`}>
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
