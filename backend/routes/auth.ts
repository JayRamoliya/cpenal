import { Router, Request, Response } from 'express';
import { getDatabase, addActivityLog } from '../db/database.js';

const router = Router();

export interface AuthSessionUser {
  id: string;
  username: string;
  email: string;
  role: 'superadmin' | 'reseller' | 'customer';
  primaryDomain: string;
  serverIp: string;
  homeDir: string;
  cpanelVersion: string;
  packageId?: string;
  packageName?: string;
  accountId?: string;
  status?: string;
}

// Token storage map (token -> user payload)
const sessionStore = new Map<string, AuthSessionUser>();

// Pre-seed superadmin token
const ROOT_USER: AuthSessionUser = {
  id: 'usr_root_00',
  username: 'root',
  email: 'root@hostmaster.cloud',
  role: 'superadmin',
  primaryDomain: 'hostmaster.cloud',
  serverIp: '192.168.1.100',
  homeDir: '/root',
  cpanelVersion: '118.0.12 (Build 2026)',
};

router.post('/login', (req: Request, res: Response) => {
  const { username, password, targetPanel = 'auto' } = req.body || {};
  const cleanUser = String(username || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();
  const db = getDatabase();

  // 1. Super Admin Authentication (root / whm123 or admin / admin123)
  if ((cleanUser === 'root' || cleanUser === 'root@hostmaster.cloud') && cleanPass === 'whm123' ||
      (cleanUser === 'admin' && cleanPass === 'admin123')) {
    const token = `whm_root_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStore.set(token, ROOT_USER);
    addActivityLog('root', 'whm', 'LOGIN_SUCCESS', 'WHM Root Session', req.ip);

    return res.json({
      success: true,
      token,
      user: ROOT_USER,
      defaultRoute: '/whm',
      message: 'Authenticated as WHM Super Administrator.',
    });
  }

  // 2. Hosting Customer Accounts Authentication
  // Find matching account in database
  const account = db.accounts.find(
    (a) => a.username.toLowerCase() === cleanUser || a.domain.toLowerCase() === cleanUser || a.email.toLowerCase() === cleanUser
  );

  if (account) {
    // Check credentials (accept cpanel123, acme123, or standard password)
    const valid = 
      cleanPass === 'cpanel123' || 
      (cleanUser === 'acme' && cleanPass === 'acme123') ||
      cleanPass.length >= 4;

    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid cPanel credentials.' });
    }

    if (account.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: `This hosting account (${account.domain}) is currently SUSPENDED. Reason: ${account.suspendReason || 'Please contact server administrator.'}`,
      });
    }

    const customerUser: AuthSessionUser = {
      id: account.id,
      username: account.username,
      email: account.email,
      role: 'customer',
      primaryDomain: account.domain,
      serverIp: account.ip,
      homeDir: `/home/${account.username}`,
      cpanelVersion: '118.0.12 (Build 2026)',
      packageId: account.packageId,
      packageName: account.packageName,
      accountId: account.id,
      status: account.status,
    };

    const token = `cpanel_${account.username}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStore.set(token, customerUser);
    addActivityLog(account.username, 'cpanel', 'LOGIN_SUCCESS', account.domain, req.ip, account.id);

    return res.json({
      success: true,
      token,
      user: customerUser,
      defaultRoute: '/cpanel',
      message: `Welcome to cPanel for ${account.domain}.`,
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid credentials. For WHM use root / whm123. For cPanel use demo / cpanel123 or acme / acme123.',
  });
});

// WHM Super Admin: Switch session into a customer's cPanel ("Login to cPanel" action)
router.post('/impersonate', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  const currentUser = token ? sessionStore.get(token) : null;

  if (currentUser?.role !== 'superadmin' && !token?.startsWith('whm_root_')) {
    return res.status(403).json({ error: 'Only WHM Super Admin can impersonate cPanel accounts' });
  }

  const { accountId, username } = req.body || {};
  const db = getDatabase();
  const targetAcc = db.accounts.find((a) => a.id === accountId || a.username === username);

  if (!targetAcc) {
    return res.status(404).json({ error: 'Target hosting account not found' });
  }

  const customerUser: AuthSessionUser = {
    id: targetAcc.id,
    username: targetAcc.username,
    email: targetAcc.email,
    role: 'customer',
    primaryDomain: targetAcc.domain,
    serverIp: targetAcc.ip,
    homeDir: `/home/${targetAcc.username}`,
    cpanelVersion: '118.0.12 (Build 2026)',
    packageId: targetAcc.packageId,
    packageName: targetAcc.packageName,
    accountId: targetAcc.id,
    status: targetAcc.status,
  };

  const cpanelToken = `cpanel_${targetAcc.username}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  sessionStore.set(cpanelToken, customerUser);
  addActivityLog('root', 'whm', 'CPANEL_IMPERSONATION', `Logged in to cPanel for ${targetAcc.domain} (${targetAcc.username})`, req.ip, targetAcc.id);

  return res.json({
    success: true,
    token: cpanelToken,
    user: customerUser,
    message: `Switched into cPanel for ${targetAcc.domain}`,
  });
});

router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.json({ authenticated: false, user: null });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const user = sessionStore.get(token);

  if (user) {
    return res.json({ authenticated: true, user });
  }

  // Fallback for root token format
  if (token.startsWith('whm_root_')) {
    return res.json({ authenticated: true, user: ROOT_USER });
  }

  // Fallback for demo token format
  if (token.startsWith('cpanel_')) {
    const db = getDatabase();
    const parts = token.split('_');
    const uname = parts[1] || 'demo';
    const acc = db.accounts.find((a) => a.username === uname) || db.accounts[0];
    const customerUser: AuthSessionUser = {
      id: acc.id,
      username: acc.username,
      email: acc.email,
      role: 'customer',
      primaryDomain: acc.domain,
      serverIp: acc.ip,
      homeDir: `/home/${acc.username}`,
      cpanelVersion: '118.0.12 (Build 2026)',
      packageId: acc.packageId,
      packageName: acc.packageName,
      accountId: acc.id,
      status: acc.status,
    };
    return res.json({ authenticated: true, user: customerUser });
  }

  return res.json({ authenticated: false, user: null });
});

router.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    sessionStore.delete(token);
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;
