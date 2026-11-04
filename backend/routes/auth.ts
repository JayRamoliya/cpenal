import { Router, Request, Response } from 'express';

const router = Router();

// Demo users store
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  primaryDomain: string;
  serverIp: string;
  homeDir: string;
  cpanelVersion: string;
  role: string;
}

const DEMO_USER: AuthUser = {
  id: 'usr_demo_01',
  username: 'demo',
  email: 'demo@cpanel.local',
  primaryDomain: 'demo-site.com',
  serverIp: '192.168.1.104',
  homeDir: '/home/demo',
  cpanelVersion: '118.0.12 (Build 2026)',
  role: 'Account Owner',
};

// Simple secure session token mapping
const activeTokens = new Set<string>();

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body || {};

  const cleanUser = String(username || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();

  // Validate credentials: allow "demo" or "demo@cpanel.local" with password "cpanel123"
  // Also allow "admin" / "admin123" for demo convenience
  const isValid = 
    (cleanUser === 'demo' || cleanUser === 'demo@cpanel.local') && cleanPass === 'cpanel123' ||
    (cleanUser === 'admin' || cleanUser === 'admin@cpanel.local') && cleanPass === 'admin123';

  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid cPanel login credentials. Use demo / cpanel123',
    });
  }

  const token = `cpanel_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  activeTokens.add(token);

  return res.json({
    success: true,
    token,
    user: DEMO_USER,
    message: 'Authentication successful. Welcome to cPanel.',
  });
});

router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.json({ authenticated: false, user: null });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (activeTokens.has(token) || token.startsWith('cpanel_token_')) {
    return res.json({
      authenticated: true,
      user: DEMO_USER,
    });
  }

  return res.json({ authenticated: false, user: null });
});

router.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    activeTokens.delete(token);
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;
