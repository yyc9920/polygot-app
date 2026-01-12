import { render, screen } from '@testing-library/react';
import App from './App';
import { expect, test } from 'vitest';

test('renders app header', () => {
  render(<App />);
  // The header now contains "Polygot", so we check for that instead of the old text.
  const headerElement = screen.getByText(/Polygot/i);
  expect(headerElement).toBeInTheDocument();
});
