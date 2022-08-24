module.exports = {
  apps : [
  {
    name        : "fox",
    script      : "foxNews.js",
    cron_restart: "0 1 * * *",
    autorestart: false
  },
    {
    name        : "wp",
    script      : "washingtonpost.js",
    cron_restart: "0 1 * * *",
    autorestart: false
  }
  ]
}