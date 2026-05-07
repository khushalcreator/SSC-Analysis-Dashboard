"use client";

import Link from 'next/link';
import { LayoutDashboard, Upload, Users, BarChart3, Settings, FileText, BookOpen, Target } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Upload Results', href: '/upload', icon: Upload },
  { name: 'Student Data', href: '/students', icon: Users },
  { name: 'Report Cards', href: '/report-cards', icon: FileText },
  { name: 'Subject Analysis', href: '/analysis/subject', icon: BookOpen },
  { name: 'Section Analysis', href: '/analysis/section', icon: Target },
  { name: 'Class Analysis', href: '/analysis/class', icon: BarChart3 },
  { name: 'Settings', href: '#', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-72 border-r border-outline-variant bg-surface-container-lowest z-50 flex flex-col h-screen">
      {/* Brand Section */}
      <div className="p-8 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-on-primary font-black text-xl shadow-lg shadow-primary/20">
            S
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-on-surface tracking-tight leading-none uppercase">SSC Admin</h1>
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest mt-1">Academic Portal</span>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
          const reallyActive = item.href === '/' ? pathname === '/' : isActive;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200",
                reallyActive
                  ? 'bg-primary/10 text-primary border-r-4 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  reallyActive ? 'text-primary' : 'text-outline-variant group-hover:text-on-surface'
                )}
              />
              <span className="flex-1 text-sm">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* User Profile */}
      <div className="p-6 mt-auto border-t border-outline-variant">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden border border-outline-variant p-0.5">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin&backgroundColor=b6e3f4" 
              alt="Admin User"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-on-surface truncate">Admin User</p>
            <p className="text-[10px] font-medium text-outline truncate">admin@ssc.edu</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
