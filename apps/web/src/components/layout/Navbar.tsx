import { Moon, Share2, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="w-full px-4 pt-6">
      <header className="mx-auto max-w-3xl rounded-2xl border border-white/50 bg-white/60 px-5 py-3 shadow-lg shadow-slate-100/30 backdrop-blur-xl transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-950/40 dark:shadow-black/20">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="group flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-slate-900 transition hover:opacity-90 dark:text-slate-100"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-md shadow-brand-500/20 transition-all duration-300 group-hover:scale-105">
              <Share2 className="h-4.5 w-4.5" />
            </span>
            <span className="bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent dark:from-white dark:to-slate-200">
              ShareFlow
            </span>
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="btn-secondary flex h-9.5 w-9.5 items-center justify-center rounded-xl border-slate-200/60 bg-white/40 !p-0 shadow-sm transition hover:scale-105 active:scale-95 dark:border-slate-800/50 dark:bg-slate-900/30"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-500 transition-all duration-300 hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-brand-600 transition-all duration-300 hover:-rotate-12" />
            )}
          </button>
        </div>
      </header>
    </div>
  );
}
