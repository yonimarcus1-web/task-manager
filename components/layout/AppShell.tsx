'use client';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [businessName, setBusinessName] = useState('');
  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(s => setBusinessName(s.business_name || 'מנהל פרויקטים'));
  }, []);
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar businessName={businessName} />
      <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
    </div>
  );
}
