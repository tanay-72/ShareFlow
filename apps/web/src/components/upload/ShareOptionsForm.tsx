import { EXPIRATION_PRESETS_SECONDS, type CompleteUploadRequest } from '@shareflow/shared';
import { useState } from 'react';

interface ShareOptionsFormProps {
  onChange: (options: CompleteUploadRequest) => void;
}

type ExpiryPreset = 'ONE_HOUR' | 'ONE_DAY' | 'SEVEN_DAYS' | 'CUSTOM' | 'NEVER';

const PRESET_LABELS: Record<Exclude<ExpiryPreset, 'CUSTOM' | 'NEVER'>, string> = {
  ONE_HOUR: '1 hour',
  ONE_DAY: '1 day',
  SEVEN_DAYS: '7 days',
};

export function ShareOptionsForm({ onChange }: ShareOptionsFormProps) {
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>('ONE_DAY');
  const [customDays, setCustomDays] = useState(30);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState('');
  const [oneTimeDownload, setOneTimeDownload] = useState(false);

  function emit(next: {
    expiryPreset: ExpiryPreset;
    customDays: number;
    passwordEnabled: boolean;
    password: string;
    oneTimeDownload: boolean;
  }) {
    const expiresInSeconds =
      next.expiryPreset === 'NEVER'
        ? undefined
        : next.expiryPreset === 'CUSTOM'
          ? Math.round(next.customDays * 24 * 60 * 60)
          : EXPIRATION_PRESETS_SECONDS[next.expiryPreset];

    onChange({
      expiresInSeconds,
      password: next.passwordEnabled && next.password ? next.password : undefined,
      oneTimeDownload: next.oneTimeDownload,
    });
  }

  return (
    <div className="card space-y-5 p-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Link expiration
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRESET_LABELS) as Array<keyof typeof PRESET_LABELS>).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setExpiryPreset(preset);
                emit({ expiryPreset: preset, customDays, passwordEnabled, password, oneTimeDownload });
              }}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                expiryPreset === preset
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {PRESET_LABELS[preset]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setExpiryPreset('CUSTOM');
              emit({ expiryPreset: 'CUSTOM', customDays, passwordEnabled, password, oneTimeDownload });
            }}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              expiryPreset === 'CUSTOM'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Custom
          </button>
        </div>
        {expiryPreset === 'CUSTOM' && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={30}
              value={customDays}
              onChange={(event) => {
                const value = Number(event.target.value);
                setCustomDays(value);
                emit({ expiryPreset: 'CUSTOM', customDays: value, passwordEnabled, password, oneTimeDownload });
              }}
              className="input w-24"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">days (max 30)</span>
          </div>
        )}
      </div>

      <label className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password protect</span>
        <input
          type="checkbox"
          checked={passwordEnabled}
          onChange={(event) => {
            setPasswordEnabled(event.target.checked);
            emit({ expiryPreset, customDays, passwordEnabled: event.target.checked, password, oneTimeDownload });
          }}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
      </label>
      {passwordEnabled && (
        <input
          type="password"
          placeholder="Enter a password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            emit({ expiryPreset, customDays, passwordEnabled, password: event.target.value, oneTimeDownload });
          }}
          className="input"
        />
      )}

      <label className="flex items-center justify-between gap-4">
        <div>
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            One-time download
          </span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">
            File is deleted automatically after the first download
          </span>
        </div>
        <input
          type="checkbox"
          checked={oneTimeDownload}
          onChange={(event) => {
            setOneTimeDownload(event.target.checked);
            emit({ expiryPreset, customDays, passwordEnabled, password, oneTimeDownload: event.target.checked });
          }}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
      </label>
    </div>
  );
}
