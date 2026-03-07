import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { UserProvider, useUser } from '../../context/UserContext';
import type { ActiveUser } from '../../context/UserContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}

const adminUser: ActiveUser = {
  userId: 1,
  name: 'Alice',
  email: 'alice@test.com',
  role: 'Admin',
  authenticated: true,
  token: 'jwt-token',
  companyId: 1,
  companyName: 'Acme',
  refreshToken: 'refresh-token',
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('UserContext initial state', () => {
  it('starts unauthenticated as Guest Viewer', () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user.role).toBe('Viewer');
    expect(result.current.user.name).toBe('Guest');
  });
});

describe('setUser', () => {
  it('updates user state', () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => { result.current.setUser(adminUser); });
    expect(result.current.user.name).toBe('Alice');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('persists token, companyId, refreshToken, and active-user to localStorage', () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => { result.current.setUser(adminUser); });
    expect(localStorage.getItem('erp-token')).toBe('jwt-token');
    expect(localStorage.getItem('erp-company-id')).toBe('1');
    expect(localStorage.getItem('erp-refresh-token')).toBe('refresh-token');
    expect(JSON.parse(localStorage.getItem('erp-active-user')!).name).toBe('Alice');
  });
});

describe('logout', () => {
  it('resets to GUEST_USER', () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => { result.current.setUser(adminUser); });
    act(() => { result.current.logout(); });
    expect(result.current.user.name).toBe('Guest');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('clears all erp-* keys from localStorage', () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => { result.current.setUser(adminUser); });
    act(() => { result.current.logout(); });
    expect(localStorage.getItem('erp-token')).toBeNull();
    expect(localStorage.getItem('erp-refresh-token')).toBeNull();
    expect(localStorage.getItem('erp-company-id')).toBeNull();
    expect(localStorage.getItem('erp-active-user')).toBeNull();
  });
});

describe('switchCompany', () => {
  it('updates companyId and companyName', () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => { result.current.setUser(adminUser); });
    act(() => { result.current.switchCompany(2, 'Globex'); });
    expect(result.current.user.companyId).toBe(2);
    expect(result.current.user.companyName).toBe('Globex');
    expect(localStorage.getItem('erp-company-id')).toBe('2');
  });
});

describe('isAdmin', () => {
  it('is true when role is Admin', () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => { result.current.setUser({ ...adminUser, role: 'Admin', isSuperAdmin: false }); });
    expect(result.current.isAdmin).toBe(true);
  });

  it('is true when isSuperAdmin is true regardless of role', () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => { result.current.setUser({ ...adminUser, role: 'Viewer', isSuperAdmin: true }); });
    expect(result.current.isAdmin).toBe(true);
  });

  it('is false when role is Viewer and not SuperAdmin', () => {
    const { result } = renderHook(() => useUser(), { wrapper });
    act(() => { result.current.setUser({ ...adminUser, role: 'Viewer', isSuperAdmin: false }); });
    expect(result.current.isAdmin).toBe(false);
  });
});
