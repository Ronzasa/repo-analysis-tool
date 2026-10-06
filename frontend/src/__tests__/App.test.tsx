import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('should render the header', () => {
    render(<App />);
    const headerElement = screen.getByText(/Repository Analysis Tool/i);
    expect(headerElement).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(<App />);
    const dashboardLink = screen.getByText(/Dashboard/i);
    const uploadLink = screen.getByText(/Upload Repository/i);
    expect(dashboardLink).toBeInTheDocument();
    expect(uploadLink).toBeInTheDocument();
  });
});
