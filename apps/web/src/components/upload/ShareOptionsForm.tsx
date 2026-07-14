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
    <div className="card space-y-6 p-6">
      <div>
        <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">
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
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                expiryPreset === preset
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/10'
                  : 'bg-slate-100 text-slate-750 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/80'
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
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 ${
              expiryPreset === 'CUSTOM'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/10'
                : 'bg-slate-100 text-slate-750 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/80'
            }`}
          >
            Custom
          </button>
        </div>
        {expiryPreset === 'CUSTOM' && (
          <div className="mt-3.5 flex items-center gap-2">
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
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">days (max 30)</span>
          </div>
        )}
      </div>

      <div className="space-y-4 pt-2">
        <label className="flex cursor-pointer items-center justify-between gap-4 select-none">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password protect</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={passwordEnabled}
              onChange={(event) => {
                setPasswordEnabled(event.target.checked);
                emit({ expiryPreset, customDays, passwordEnabled: event.target.checked, password, oneTimeDownload });
              }}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-slate-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-500/10 dark:bg-slate-800 dark:after:border-slate-600 dark:after:bg-slate-300 dark:peer-focus:ring-brand-500/15" />
          </div>
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
            className="input mt-2"
          />
        )}

        <label className="flex cursor-pointer items-center justify-between gap-4 select-none pt-2">
          <div>
            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              One-time download
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              File is deleted automatically after the first download
            </span>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={oneTimeDownload}
              onChange={(event) => {
                setOneTimeDownload(event.target.checked);
                emit({ expiryPreset, customDays, passwordEnabled, password, oneTimeDownload: event.target.checked });
              }}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-slate-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-500/10 dark:bg-slate-800 dark:after:border-slate-600 dark:after:bg-slate-300 dark:peer-focus:ring-brand-500/15" />
          </div>
        </label>
      </div>
    </div>
  );
}
