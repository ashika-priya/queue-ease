import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Layers,
  Tv,
  PlusCircle,
  Ticket,
  LayoutDashboard,
  QrCode,
  BarChart3,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  UserCheck
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-[#0B132B]/90 backdrop-blur-md border-b border-[#1E2D4A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-glow-blue shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-cyan-400 transition-colors block leading-tight">
                Queue Ease
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                Smart Queue Inside
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'text-cyan-400 bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
              }`}
            >
              Home
            </Link>

            <Link
              to="/join"
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                isActive('/join') ? 'text-cyan-400 bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-blue-400" />
              Join Queue
            </Link>

            <Link
              to="/display"
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                isActive('/display') ? 'text-cyan-400 bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
              }`}
              target="_blank"
              title="Open Public Waiting Lounge TV Display in New Tab"
            >
              <Tv className="w-4 h-4 text-emerald-400" />
              TV Display
            </Link>

            <Link
              to="/customer"
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                isActive('/customer') ? 'text-cyan-400 bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
              }`}
            >
              <Ticket className="w-4 h-4 text-amber-400" />
              My Tickets
            </Link>

            {(user?.role === 'staff' || user?.role === 'admin') && (
              <Link
                to="/staff"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  isActive('/staff') ? 'text-cyan-400 bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                Staff Desk
              </Link>
            )}

            {user?.role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    isActive('/admin') ? 'text-cyan-400 bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  Admin Console
                </Link>

                <Link
                  to="/admin/qr"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    isActive('/admin/qr') ? 'text-cyan-400 bg-navy-800' : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-sky-400" />
                  QR Studio
                </Link>
              </>
            )}
          </nav>

          {/* User Account / Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2.5">
                <div className="flex items-center space-x-2 bg-navy-800/90 border border-[#1E2D4A] px-3 py-1.5 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-blue-600/40 text-blue-300 flex items-center justify-center text-xs font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-200 leading-tight">
                      {user?.name}
                    </p>
                    <p className="text-[10px] text-cyan-400 capitalize font-medium">
                      {user?.role}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-navy-800 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-navy-800/80 hover:bg-navy-700 border border-[#1E2D4A] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg shadow-glow-blue transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0E1736] border-b border-[#1E2D4A] px-4 pt-2 pb-4 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-navy-800"
          >
            Home
          </Link>
          <Link
            to="/join"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-navy-800"
          >
            Join Queue
          </Link>
          <Link
            to="/display"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-navy-800"
          >
            TV Display
          </Link>
          <Link
            to="/customer"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-navy-800"
          >
            My Tickets
          </Link>
          {(user?.role === 'staff' || user?.role === 'admin') && (
            <Link
              to="/staff"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-cyan-400 hover:bg-navy-800"
            >
              Staff Desk
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-purple-400 hover:bg-navy-800"
            >
              Admin Console
            </Link>
          )}
          <div className="pt-2 border-t border-[#1E2D4A]">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-navy-800 rounded-md"
              >
                Sign Out ({user?.name})
              </button>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-medium bg-navy-800 rounded-md text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-medium bg-blue-600 rounded-md text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
