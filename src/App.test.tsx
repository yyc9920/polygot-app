import { render, screen } from '@testing-library/react';
import App from './App';
import { expect, test } from 'vitest';

test('renders app header', () => {
  render(<App />);
  const linkElement = screen.getByText(/Learn Language via CSV/i);
  expect(linkElement).toBeInTheDocument();
});