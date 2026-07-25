module.exports = {
  apps: [
    {
      name: "zero-trust-media-api",
      script: "./index.js",
      instances: 1, // Or "max" for clustering
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000
      }
    }
  ]
};
