const sql = require("mssql")
const validation = require("jq-lang/validation")
const { DB } = process.env
console.log(`database: ${DB}`)

const dbconfig = {
  user: "user",
  password: "password",
  server: "company.database.windows.net",
  database: DB,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true // Use this if you're on Windows Azure
  }
}

const pool = new sql.ConnectionPool(dbconfig)
pool.connect(err => {
  const request = new sql.Request(pool)
  request.query(
    `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo'`,
    (err, tableResult) => {
      const tables = tableResult.recordset
      request.query(
        `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'dbo'`,
        (err, result) => {
          const list = result.recordset
          const schema = {}
          for (const t of tables) {
            const name = t.TABLE_NAME.toLowerCase()
            schema[name] = { columns: [] }
            const cols = list.filter(item => item.TABLE_NAME === t.TABLE_NAME)
            for (const c of cols) {
              schema[name].columns.push({
                name: c.COLUMN_NAME.toLowerCase(),
                type: c.DATA_TYPE
              })
            }
          }
          validation.setSchema(schema)
          console.log("------------------- schema loaded -------------------")
        }
      )
    }
  )
})

module.exports = {
  query: async (sqlText, parameters) => {
    const request = new sql.Request(pool)
    if (parameters) {
      for (const p in parameters) {
        request.input(p, parameters[p])
      }
    }
    const result = await request.query(sqlText)
    return result.recordset
  },
  getTransaction: () => pool.transaction()
}
