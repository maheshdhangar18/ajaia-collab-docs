import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, ChevronDown, Check, UserCheck, Shield } from 'lucide-react';

export function Header({ onLogoClick, docTitle, isEditing }) {
  const { currentUser, switchUser, users } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border h-14 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Logo & optional Document Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2.5 text-ink hover:opacity-85 transition-opacity group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:bg-primary-700 transition-colors">
            <FileText className="w-4 h-4" />
          </div>
          <span className="font-semibold text-base tracking-tight text-ink">
            Ajaia Docs
          </span>
        </button>

        {isEditing && docTitle && (
          <div className="hidden md:flex items-center gap-2 text-slate-400 text-sm">
            <span>/</span>
            <span className="text-slate-600 font-medium truncate max-w-xs">
              {docTitle}
            </span>
          </div>
        )}
      </div>

      {/* Right: User Switcher Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-border bg-white hover:bg-slate-50 transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-sm"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          {/* Avatar circle */}
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${currentUser.color || 'bg-primary-600 text-white'}`}>
            {currentUser.avatar}
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xs font-semibold text-ink">
                {currentUser.name}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {currentUser.role}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 leading-tight mt-0.5">
              {currentUser.email}
            </span>
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-1.5 w-72 bg-white border border-border rounded-xl shadow-dropdown py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3.5 py-2 border-b border-border/80">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <UserCheck className="w-3.5 h-3.5 text-primary-600" />
                <span>Switch Simulated Persona</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Switch accounts in one click to test document sharing and access control.
              </p>
            </div>

            <div className="py-1">
              {users.map((user) => {
                const isActive = user.email === currentUser.email;
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      switchUser(user);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors hover:bg-slate-50 ${
                      isActive ? 'bg-primary-50/60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${user.color}`}>
                        {user.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-semibold ${isActive ? 'text-primary-700' : 'text-ink'}`}>
                            {user.name}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {user.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <Check className="w-4 h-4 text-primary-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="px-3.5 pt-2 pb-1 border-t border-border/80 mt-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Shield className="w-3 h-3 text-slate-400" />
                <span>Seeded team environment (Ajaia LLC)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
