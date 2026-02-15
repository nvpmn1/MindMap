export type FixedAccountKey = 'guilherme' | 'helen' | 'pablo';

export type FixedAccount = {
  key: FixedAccountKey;
  displayName: string;
  email: string;
  password: string;
  color: string;
  workspaceRole: 'admin' | 'member';
};

// NOTE: Temporary, fixed accounts only (no self-service sign up).
// User asked for these exact credentials with no email activation.
export const FIXED_ACCOUNTS: FixedAccount[] = [
  {
    key: 'guilherme',
    displayName: 'Guilherme Oliveira',
    email: 'gui_oliveira.16@hotmail.com',
    password: 'gui1998',
    color: '#06E5FF',
    workspaceRole: 'admin',
  },
  {
    key: 'helen',
    displayName: 'Helen',
    email: 'helen23m@gmail.com',
    password: 'helen123',
    color: '#06FFD0',
    workspaceRole: 'member',
  },
  {
    key: 'pablo',
    displayName: 'Pablo',
    email: 'pablorfcosta@gmail.com',
    password: 'pablo123',
    color: '#0D99FF',
    workspaceRole: 'member',
  },
];

const allowedEmailSet = new Set(FIXED_ACCOUNTS.map((a) => a.email.toLowerCase()));

export function getFixedAccountByEmail(email: string | null | undefined): FixedAccount | null {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  return FIXED_ACCOUNTS.find((a) => a.email.toLowerCase() === normalized) || null;
}

export function isAllowedFixedAccountEmail(email: string | null | undefined): boolean {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return allowedEmailSet.has(normalized);
}
