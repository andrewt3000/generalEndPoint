const config = {
  environment: process.env.NODE_ENV || "dev",
  server: {
    port: process.env.PORT || 3001
  },
  sql: {
    connection:
      process.env.SQL_CONNECTION ||
      "x"
  }
}

module.exports = config
