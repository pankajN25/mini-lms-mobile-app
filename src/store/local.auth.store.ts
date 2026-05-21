import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@/types/domain.types';

const ACCOUNTS_KEY = '@mini_lms/local_accounts';
const SESSION_KEY  = '@mini_lms/local_session';

interface LocalAccount {
  id: string;
  username: string;
  email: string;
  password: string;
  avatarUrl: string;
  role: string;
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function loadAccounts(): Promise<LocalAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as LocalAccount[]) : [];
  } catch {
    return [];
  }
}

async function saveAccounts(accounts: LocalAccount[]): Promise<void> {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function toDomain(a: LocalAccount): User {
  return { id: a.id, username: a.username, email: a.email, avatarUrl: a.avatarUrl, role: a.role };
}

export async function localRegister(username: string, email: string, password: string): Promise<User> {
  const accounts = await loadAccounts();

  if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('EMAIL_TAKEN');
  }
  if (accounts.some((a) => a.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('USERNAME_TAKEN');
  }

  const account: LocalAccount = {
    id: makeId(),
    username,
    email,
    password,
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366F1&color=fff&size=128`,
    role: 'USER',
  };

  await saveAccounts([...accounts, account]);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(toDomain(account)));
  return toDomain(account);
}

export async function localLogin(email: string, password: string): Promise<User> {
  const accounts = await loadAccounts();
  const account = accounts.find(
    (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password,
  );
  if (!account) throw new Error('INVALID_CREDENTIALS');
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(toDomain(account)));
  return toDomain(account);
}

export async function getLocalSession(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export async function clearLocalSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function updateLocalAvatar(userId: string, avatarUrl: string): Promise<void> {
  const accounts = await loadAccounts();
  const idx = accounts.findIndex((a) => a.id === userId);
  if (idx >= 0) {
    accounts[idx].avatarUrl = avatarUrl;
    await saveAccounts(accounts);
  }
  const session = await getLocalSession();
  if (session) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, avatarUrl }));
  }
}
