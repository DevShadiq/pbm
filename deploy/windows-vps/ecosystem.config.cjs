module.exports = {
  apps: [
    {
      name: "school-management-api",
      cwd: "D:/pbm/apps/api",
      script: "src/server.js",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      kill_timeout: 5000,
      merge_logs: true,
      time: true,
      out_file: "D:/pbm/logs/api-out.log",
      error_file: "D:/pbm/logs/api-error.log",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],
};
