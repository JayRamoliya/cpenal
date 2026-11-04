<?php
/**
 * Database & Environment Configuration
 * cPanel Demo Environment
 */
define('DB_HOST', 'localhost');
define('DB_USER', 'demo_user');
define('DB_PASS', 'ProtectedSecretHash');
define('DB_NAME', 'demo_production');
define('ENVIRONMENT', 'production');
define('UPLOAD_MAX_MB', 25);

// Error reporting settings
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
