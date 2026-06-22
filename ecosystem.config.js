module.exports = {
  apps: [{
    name: "tiang-mapper-bitnet",
    script: "bun",
    args: "run src/index.ts",
    cwd: "/var/www/tools.ajengmedia.com/tiang-mapper",
    env: {
      NODE_ENV: "production"
    },
    autorestart: true,
    watch: false,
    max_memory_restart: "256M",
    log_file: "/var/log/tiang-mapper/combined.log",
    out_file: "/var/log/tiang-mapper/out.log",
    error_file: "/var/log/tiang-mapper/error.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
  }]
};
