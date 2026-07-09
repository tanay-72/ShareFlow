import { MAX_FILE_SIZE_BYTES } from '@shareflow/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dropzone } from './Dropzone';

function buildFile(name: string, sizeBytes: number): File {
  const file = new File([new Uint8Array(1)], name, { type: 'application/octet-stream' });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

describe('Dropzone', () => {
  it('passes selected files through to onFilesSelected', async () => {
    const onFilesSelected = vi.fn();
    const user = userEvent.setup();
    render(<Dropzone onFilesSelected={onFilesSelected} />);

    const file = buildFile('report.pdf', 1024);
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it('rejects a file larger than the platform maximum and shows an error', async () => {
    const onFilesSelected = vi.fn();
    const user = userEvent.setup();
    render(<Dropzone onFilesSelected={onFilesSelected} />);

    const oversized = buildFile('huge.bin', MAX_FILE_SIZE_BYTES + 1);
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, oversized);

    expect(onFilesSelected).not.toHaveBeenCalled();
    expect(screen.getByText(/exceeds the/i)).toBeInTheDocument();
  });

  it('accepts the files that fit while rejecting only the oversized ones', async () => {
    const onFilesSelected = vi.fn();
    const user = userEvent.setup();
    render(<Dropzone onFilesSelected={onFilesSelected} />);

    const okFile = buildFile('ok.bin', 1024);
    const oversized = buildFile('huge.bin', MAX_FILE_SIZE_BYTES + 1);
    const input = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [okFile, oversized]);

    expect(onFilesSelected).toHaveBeenCalledWith([okFile]);
  });
});
