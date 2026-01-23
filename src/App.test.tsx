import { render, screen } from '@testing-library/react';
import './lib/i18n'; // Ensure i18n is initialized
import App from './App';
import { expect, test } from 'vitest';

test('renders app header', async () => {
  render(<App />);
  // The header now contains "Polyglot", so we check for that instead of the old text.
  const headerElement = await screen.findByText(/Polyglot/i);
  expect(headerElement).toBeInTheDocument();
});
