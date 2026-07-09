import { Moon, Share2, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Share2 className="h-4 w-4" />
          </span>
          ShareFlow
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="btn-secondary !px-2.5 !py-2.5"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
