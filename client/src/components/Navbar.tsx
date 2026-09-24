'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/authContext';
import {
  Sparkles,
  BookOpen,
  PlusCircle,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  Menu,
  X,
  Home,
  LayoutDashboard,
  Layers,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    router.push('/login');
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'My Kits', icon: LayoutDashboard },
    { href: '/kit/new', label: 'Create Prep Kit', icon: PlusCircle, highlight: true },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/90 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center space-x-2.5 sm:space-x-3 group min-w-0"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <BrandLogo size="md" className="group-hover:scale-105 transition-transform" />
          <div className="flex items-center">
            <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              PrepKit AI
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              v1.0
            </span>
          </div>
        </Link>

        {/* Center Nav (Desktop) */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            href="/dashboard"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/dashboard'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            My Kits
          </Link>
          <Link
            href="/kit/new"
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/kit/new'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-indigo-600/20'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Prep Kit</span>
          </Link>
        </nav>

        {/* Right side: Auth (Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Deterministic Engine Active</span>
          </div>

          {user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
                <UserIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="truncate max-w-[140px]">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Header Right (Hamburger Button & quick status) */}
        <div className="flex items-center space-x-2 md:hidden">
          {user && (
            <div
              className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400"
              title={user.email}
            >
              <UserIcon className="w-4 h-4" />
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/60 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            aria-label="Toggle Navigation Menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 flex flex-col justify-between overflow-y-auto p-4 sm:p-6 md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="space-y-4">
            {/* System Status Pill */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <span className="text-slate-400">System Status</span>
              <span className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Deterministic Engine Active</span>
              </span>
            </div>

            {/* Navigation links */}
            <nav className="space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : link.highlight
                        ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{link.label}</span>
                    </div>
                    {link.highlight && !isActive && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                        New
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Auth Info & Actions */}
          <div className="pt-6 border-t border-slate-800/80 mt-6 space-y-3">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-400">Signed in as</div>
                    <div className="text-sm font-medium text-white truncate">{user.email}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-sm font-semibold transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            <div className="text-center pt-2">
              <span className="text-[11px] text-slate-500">
                PrepKit AI • Personalized Interview Prep
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
