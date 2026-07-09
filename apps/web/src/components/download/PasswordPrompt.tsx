import { Lock } from 'lucide-react';
import { useState } from 'react';

interface PasswordPromptProps {
  onSubmit: (password: string) => void;
  errorMessage?: string;
  isSubmitting?: boolean;
}

export function PasswordPrompt({ onSubmit, errorMessage, isSubmitting }: PasswordPromptProps) {
  const [password, setPassword] = useState('');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(password);
      }}
      className="card space-y-4 p-6 text-center"
    >
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
        <Lock className="h-5 w-5" />
      </span>
      <div>
        <p className="font-medium text-slate-900 dark:text-slate-100">This file is password protected</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Enter the password to continue</p>
      </div>
      <input
        type="password"
        autoFocus
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="input text-center"
        placeholder="Password"
      />
      {errorMessage && <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>}
      <button type="submit" className="btn-primary w-full" disabled={isSubmitting || password.length === 0}>
        {isSubmitting ? 'Checking…' : 'Unlock'}
      </button>
    </form>
  );
}
