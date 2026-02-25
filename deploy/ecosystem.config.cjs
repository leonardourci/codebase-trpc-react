module.exports = {
  apps: [{
    name: 'api',                    // change per project to avoid PM2 conflicts
    script: 'dist/server.js',
    cwd: './back-end',
    autorestart: true,
    max_memory_restart: '300M',
    env_file: '.env.backend',
    env: { NODE_ENV: 'production' },
    out_file: './logs/api.log',
    error_file: './logs/api-error.log',
  }],
}
