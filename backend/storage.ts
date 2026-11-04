import fs from 'fs';
import path from 'path';

// Root sandbox directory for all cPanel hosting accounts
export const CPANEL_BASE_DIR = path.resolve(process.cwd(), 'cpanel_storage');
export const HOME_DIR = path.join(CPANEL_BASE_DIR, 'home');

// Security helper: ensure requested path is strictly within the customer's /home/{username} directory
export function resolveAccountSafePath(username: string, userRelativePath: string = ''): { safePath: string; displayPath: string; isAllowed: boolean } {
  const cleanUsername = String(username).toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const userHomeDir = path.join(HOME_DIR, cleanUsername);

  if (!fs.existsSync(userHomeDir)) {
    try {
      fs.mkdirSync(path.join(userHomeDir, 'public_html'), { recursive: true });
    } catch {
      // ignore
    }
  }

  let cleaned = userRelativePath.trim().replace(/\\/g, '/');

  // Strip prefix if user passed full /home/{username}
  const prefix = `/home/${cleanUsername}`;
  if (cleaned.startsWith(prefix)) {
    cleaned = cleaned.replace(new RegExp(`^/home/${cleanUsername}`), '');
  }

  cleaned = cleaned.replace(/^\/+/, '');
  const absolutePath = path.resolve(userHomeDir, cleaned);

  // Strict tenant boundary verification: absolutePath must equal or start with userHomeDir
  const isAllowed = absolutePath === userHomeDir || absolutePath.startsWith(userHomeDir + path.sep);
  const relativeFromHome = path.relative(userHomeDir, absolutePath).replace(/\\/g, '/');
  const displayPath = `/home/${cleanUsername}` + (relativeFromHome ? '/' + relativeFromHome : '');

  return {
    safePath: absolutePath,
    displayPath,
    isAllowed,
  };
}

// Compute directory size and file count
export function calculateAccountDirectoryStats(dirPath: string): { totalBytes: number; fileCount: number; folderCount: number } {
  let totalBytes = 0;
  let fileCount = 0;
  let folderCount = 0;

  function traverse(current: string) {
    try {
      if (!fs.existsSync(current)) return;
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(current, entry.name);
        try {
          if (entry.isDirectory()) {
            folderCount++;
            traverse(full);
          } else if (entry.isFile()) {
            fileCount++;
            const stats = fs.statSync(full);
            totalBytes += stats.size;
          }
        } catch {
          // unreadable
        }
      }
    } catch {
      // directory error
    }
  }

  traverse(dirPath);
  return { totalBytes, fileCount, folderCount };
}

// Provision isolated directory structure for a new hosting account
export function provisionAccountDirectory(username: string, domain: string) {
  const cleanUser = String(username).toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const userHome = path.join(HOME_DIR, cleanUser);
  const publicHtml = path.join(userHome, 'public_html');

  const dirs = [
    publicHtml,
    path.join(publicHtml, 'css'),
    path.join(publicHtml, 'js'),
    path.join(publicHtml, 'images'),
    path.join(userHome, 'mail'),
    path.join(userHome, 'logs'),
    path.join(userHome, 'ssl'),
  ];

  for (const d of dirs) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  }

  // Seed default website index.html
  const indexPath = path.join(publicHtml, 'index.html');
  if (!fs.existsSync(indexPath)) {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${domain} | Hosted on cPanel</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 1.5rem;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 600px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: rgba(14, 165, 233, 0.15);
      color: #38bdf8;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    h1 { margin: 0 0 1rem; font-size: 2rem; color: #fff; }
    p { color: #94a3b8; font-size: 1rem; line-height: 1.6; }
    .meta { margin-top: 1.5rem; font-family: monospace; font-size: 0.85rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">AutoSSL &amp; Apache Active</div>
    <h1>Welcome to ${domain}!</h1>
    <p>Your web hosting account has been created and provisioned on our high-performance cluster. Replace this index.html file in your <code>public_html</code> directory using cPanel File Manager or FTP.</p>
    <div class="meta">Account Owner: ${cleanUser} · Server Root: /home/${cleanUser}/public_html</div>
  </div>
</body>
</html>`;
    fs.writeFileSync(indexPath, htmlContent, 'utf-8');
  }

  // Seed .htaccess
  const htaccessPath = path.join(publicHtml, '.htaccess');
  if (!fs.existsSync(htaccessPath)) {
    fs.writeFileSync(htaccessPath, `# cPanel generated configuration for ${domain}\nRewriteEngine On\n`, 'utf-8');
  }

  // Seed robots.txt
  const robotsPath = path.join(publicHtml, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    fs.writeFileSync(robotsPath, `User-agent: *\nAllow: /\n`, 'utf-8');
  }
}

// Initialize on boot for existing accounts
export function initializeStorage() {
  if (!fs.existsSync(HOME_DIR)) {
    fs.mkdirSync(HOME_DIR, { recursive: true });
  }

  // Provision both demo accounts for multi-tenant verification
  provisionAccountDirectory('demo', 'demo-site.com');
  provisionAccountDirectory('acme', 'acmecorp.net');
}

// Delete account directory (for account termination)
export function deleteAccountDirectory(username: string) {
  const cleanUser = String(username).toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const userHome = path.join(HOME_DIR, cleanUser);
  if (fs.existsSync(userHome)) {
    fs.rmSync(userHome, { recursive: true, force: true });
  }
}
