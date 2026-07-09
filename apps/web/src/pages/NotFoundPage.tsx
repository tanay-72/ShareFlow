import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">404</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">This page doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to ShareFlow
      </Link>
    </div>
  );
}
