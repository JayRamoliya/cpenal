# cPanel - Mini Hosting Control Panel & File Manager Clone

A modern, high-fidelity hosting control panel inspired by cPanel's Jupiter interface. Features a fully functioning browser-based File Manager, real-time filesystem persistence, drag-and-drop upload, code editing, image previews, and server management modules.

---

## 🚀 Demo Credentials

| Field | Value |
|---|---|
| **Username** | `demo` *(or `demo@cpanel.local`)* |
| **Password** | `cpanel123` |
| **Default Web Directory** | `/home/demo/public_html/` |
| **Primary Domain** | `demo-site.com` |

*(A "Quick Fill" button is also provided on the login page for instant access.)*

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons
- **Backend**: Node.js, Express.js
- **Upload Engine**: Multer (multi-file handling, MIME & extension safety)
- **Archiving & Download**: Archiver (dynamic streaming ZIP generation)
- **Filesystem API**: Native Node.js `fs` sandbox with strict path traversal prevention

---

## 📁 Key Features

### 1. Fully Working File Manager (`/home/demo/public_html`)
- **Folder Navigation & Breadcrumbs**: Click through directories or jump up levels.
- **Drag & Drop Upload**: Upload single or multiple files with live progress percentage.
- **File & Folder Creation**: Create `.html`, `.css`, `.js`, `.php`, or directories instantly.
- **In-Browser Code Editor**: Full-featured code editor with line numbering, word/char count, and real-time save to backend.
- **Image Previews**: Inline high-resolution viewer for SVG, PNG, JPG, and WebP graphics.
- **Downloads**: Download individual files or multi-select items to receive an on-the-fly generated `.zip` bundle.
- **Rename & Delete**: Instant server-side rename and single/bulk deletion.
- **Permissions**: Unix permission calculator and modal (`0755`, `0644`).
- **Search & Sorting**: Instant live filter and sort by name, size, type, or modified date.

### 2. cPanel Dashboard Overview
- Real-time disk storage gauge and available capacity meters.
- Total files and total directories counters.
- Live filesystem activity audit feed.
- Server overview: IP address, Apache version, PHP 8.3, SSL status, and MySQL database info.

### 3. Additional Hosting Modules
- **Images & Media**: Web asset gallery with file inspector and download links.
- **Disk Usage**: Interactive breakdown by folder (`public_html`, `mail`, `logs`, `ssl`).
- **FTP Accounts**: Create and delete FTP accounts locked to specific paths and quotas.
- **Directory Privacy**: Configure HTTP Basic Authentication realms (.htpasswd) on folders.
- **Backup Wizard**: Generate and download a full `.zip` archive of `/home/demo` on demand.
- **Server Settings**: MultiPHP version selector (8.1, 8.2, 8.3) and PHP.ini directives.

---

## 🔒 Security Measures

- **Path Traversal Protection**: Every request canonicalizes paths via `resolveSafePath()` to guarantee operations cannot escape `/home/demo`.
- **Upload Restrictions**: Maximum 25MB per file limit with restrictions against executable server binaries (`.exe`, `.bat`, etc.).
- **Filename Sanitization**: Uploaded and created filenames are sanitized against illegal characters.

---

## 💻 Local Installation & Setup

```bash
# 1. Clone repository & install dependencies
npm install

# 2. Run development server (runs Express backend with Vite middleware)
npm run dev

# 3. Access in browser
http://localhost:3000
```
