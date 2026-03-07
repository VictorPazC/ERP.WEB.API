import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

beforeEach(() => {
  localStorage.clear();
  // Stub matchMedia — jsdom doesn't implement it
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
});

afterEach(() => {
  localStorage.clear();
});

describe('ThemeContext', () => {
  it('defaults to light when localStorage is empty and prefers-color-scheme is light', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('light');
  });

  it('toggle switches from light to dark', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => { result.current.toggle(); });
    expect(result.current.theme).toBe('dark');
  });

  it('toggle switches from dark to light', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => { result.current.toggle(); }); // → dark
    act(() => { result.current.toggle(); }); // → light
    expect(result.current.theme).toBe('light');
  });

  it('persists theme to localStorage under erp-theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => { result.current.toggle(); }); // → dark
    expect(localStorage.getItem('erp-theme')).toBe('dark');
  });
});
