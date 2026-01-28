import { render, screen } from '@testing-library/react';
import './lib/i18n';
import App from './App';
import { expect, test, vi } from 'vitest';

vi.mock('./lib/migration', () => ({
  getStorageMetadata: vi.fn().mockResolvedValue({ schemaVersion: 2, migrationLog: [] }),
  needsMigration: vi.fn().mockReturnValue(false),
  runMigration: vi.fn().mockResolvedValue({ success: true, migratedCount: 0, migrationMap: {} }),
}));

test('renders app header', async () => {
  render(<App />);
  const headerElement = await screen.findByText(/Polyglot/i);
  expect(headerElement).toBeInTheDocument();
});
