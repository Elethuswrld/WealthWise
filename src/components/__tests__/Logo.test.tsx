import React from 'react';
import { render, screen } from '@testing-library/react';
import { Logo } from '@/components/logo';

// Mock Next.js Link component
jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode, href: string }) => {
        return <a href={href}>{children}</a>;
    };
});

describe('Logo component', () => {
  it('should render the company name', () => {
    render(<Logo />);
    const headingElement = screen.getByText(/WealthWise/i);
    expect(headingElement).toBeInTheDocument();
  });

  it('should be wrapped in a link pointing to the dashboard', () => {
    render(<Logo />);
    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveAttribute('href', '/dashboard');
  });
});
