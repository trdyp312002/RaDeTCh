module.exports = {
  apps: [
    {
      name: 'omnitrade-bot',
      script: 'C:\\Users\\trdyp\\AppData\\Local\\Programs\\Python\\Launcher\\py.exe',
      args: 'main.py',
      cwd: __dirname,
      interpreter: 'none',
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      env: {
        PYTHONUNBUFFERED: '1',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      merge_logs: true,
    },
  ],
}
