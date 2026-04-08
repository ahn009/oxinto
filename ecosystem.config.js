'use strict';

// PM2 configuration for production deployment
module.exports = {
  apps: [
    {
      name: 'smart-ai-recommendation',
      script: 'src/app.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      // Restart on crash, but not too aggressively
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/smart-ai-recommendation.git',
      path: '/var/www/smart-ai-recommendation',
      'post-deploy': 'npm ci --omit=dev && npm run migrate && pm2 reload ecosystem.config.js --env production',
    },
  },
};
