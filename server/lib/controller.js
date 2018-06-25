const db = require("../db")
const { diff } = require("deep-object-diff")
const _ = require("lodash")
const { stripArrays } = require("jql/utils")
const { getSelectSql, getCountSql, getUpdateSql, getInsertSql } = require("jql")
const { isValidTable } = require("jql/validation")

class Controller {
  constructor(model) {
    this.model = model
    this.db = db
  }

  async findById(req, res, next) {
    let { model } = this
    if (!model && req.params.model) {
      ;({ model } = req.params)
    }

    if (!isValidTable(model)) {
      const err = `findByQuery: Invalid table name ${model}`
      console.error(err)
      return res.status(400).json(err)
    }

    const parameters = { id: req.params.id }
    const result = await this.query(
      `select * from ${model} where id = @id`,
      parameters
    )
    return res.status(200).json(result[0])
  }

  async findAll(req, res, next) {
    let { model } = this
    if (!model && req.params.model) {
      ;({ model } = req.params)
    }

    if (!isValidTable(model)) {
      const err = `findByQuery: Invalid table name ${model}`
      console.error(err)
      return res.status(400).json(err)
    }

    const result = await this.query(`select * from ${model}`)
    return res.status(200).json(result)
  }

  async findByQuery(req, res, next) {
    let { model } = this
    if (!model && req.params.model) {
      ;({ model } = req.params)
    }

    if (!isValidTable(model)) {
      const err = `findByQuery: Invalid table name ${model}`
      console.error(err)
      return res.status(400).json(err)
    }

    try {
      const sql = getSelectSql(model, req.body)
      const result = await this.query(sql)

      const { children } = req.body
      // populate child records as an array on parent object
      if (children && children.length > 0) {
        await this.populateChildren(result, children, model)
      }
      return res.status(200).json(result)
    } catch (exception) {
      console.error(`Error in findByQuery. ${exception}`)
      return res.status(500).json(exception)
    }
  }

  async populateChildren(records, children, model) {
    for (const parent of records) {
      for (const child of children) {
        if (typeof child === "string") {
          if (!isValidTable(child)) {
            throw new Error("populateChildren: Invalid table name: " + child)
          }
          const details = await this.query(
            `select * from ${child} where ${model}ID = ${parent.ID} `
          )
          parent[child] = details
        } else {
          // if object
          const whereField = `${model}ID`
          if (child.where === undefined) {
            child.where = {}
          }
          child.where[whereField] = parent.ID
          // `select * from ${child.table} where ${model}ID = ${parent.ID} `
          if (!isValidTable(child.table)) {
            throw new Error(`invalid table name ${child.table}`)
          }
          const details = await this.query(getSelectSql(child.table, child))
          parent[child.table] = details
          /* //make children recursive
          if (child.children > 0){
            parent[child.table] = await this.populateChildren(details, child.children, child.table)
          }else{
            parent[child.table] = details
          } */
        }
      }
    }
    return records
  }

  async count(req, res, next) {
    let { model } = this
    if (!model && req.params.model) {
      ;({ model } = req.params)
    }

    if (!isValidTable(model)) {
      const err = `findByQuery: Invalid table name ${model}`
      console.error(err)
      return res.status(400).json(err)
    }

    let sql = getCountSql(model, req.body)

    try {
      const result = await this.db.query(sql)
      return res.status(200).json(result[0].count)
    } catch (error) {
      console.error(`Error in count(): ${error} \n\t sql: ${sql}`)
      return res.status(500).json(error)
    }
  }

  async save(req, res, next) {
    try {
      let { model } = this
      if (!model && req.params.model) {
        ;({ model } = req.params)
      }

      if (!isValidTable(model)) {
        const err = `findByQuery: Invalid table name ${model}`
        console.error(err)
        return res.status(400).json(err)
      }

      const record = await this.dbSave(
        model,
        req.body,
        req.user["https://pursell.com/name"]
      )
      return res.status(200).json(record[0])
    } catch (error) {
      console.error(`Error in save(): ${error}`)
      next(error)
    }
  }

  async dbSave(model, body, user = "unknown") {
    return new Promise(async (resolve, reject) => {
      try {
        // get object keys
        let id = Object.keys(body).find(
          key => key === "ID" || key === "id" || key === "Id"
        )
        let sql = ""
        if (id) {
          // update
          id = body[id]
          sql = getUpdateSql(model, body)
          const before = await this.dbFindById(model, id)
          await this.query(sql, body)

          // loop throught the before record and turn dates to
          for (const prop in before) {
            if (before[prop] instanceof Date) {
              before[prop] = before[prop].toISOString()
            }
          }
          const delta = diff(before, stripArrays(body))
          if (!_.isEmpty(delta)) {
            this.logToDB(model, id, "update", user, before, body, delta)
          }
        } else {
          // insert
          sql = getInsertSql(model, body)
          const result = await this.query(sql, body)
          id = result[0].id
          this.logToDB(model, id, "Insert", user, {}, body)
        }

        // save child records if there are any arrays attached to parent
        const children = []
        for (const key in body) {
          if (Array.isArray(body[key])) {
            children.push(key)
            for (const row of body[key]) {
              if (row[`${model}ID`] === "new") {
                row[`${model}ID`] = id
              }
              await this.dbSave(key, row, user)
            }
          } else if (key === "deletedChildren") {
            for (const tableName in body.deletedChildren) {
              for (const childID of body.deletedChildren[tableName]) {
                const before = await this.dbFindById(tableName, childID)
                await this.query(`delete from ${tableName} where id = @id`, {
                  id: childID
                })
                this.logToDB(tableName, childID, "Delete", user, before, {})
              }
            }
          }
        }

        const record = await this.query(
          `select * from ${model} where id = ${id}`
        )
        if (children.length > 0) {
          await this.populateChildren(record, children, model)
        }
        resolve(record)
      } catch (error) {
        reject(error)
      }
    })
  }

  async remove(req, res, next) {
    let { model } = this
    if (!model && req.params.model) {
      ;({ model } = req.params)
    }

    if (!isValidTable(model)) {
      const err = `findByQuery: Invalid table name ${model}`
      console.error(err)
      return res.status(400).json(err)
    }

    try {
      const parameters = { id: req.params.id }
      const before = await this.dbFindById(model, req.params.id)
      await this.query(`delete from ${model} where id = @id`, parameters)
      this.logToDB(
        model,
        req.params.id,
        "Delete",
        req.user["https://pursell.com/name"],
        before,
        {}
      )
      return res.sendStatus(204)
    } catch (error) {
      next(error)
    }
  }

  //similar to findById. no table validation.
  async dbFindById(model, id) {
    const sql = `select * from ${model} where ID = @id`

    try {
      const result = await this.db.query(sql, { id })
      if (result.length > 0) {
        return result[0]
      }
      return {}
    } catch (error) {
      console.error(
        `Error in dbFindById(): ${error} \n\t sql: ${sql} \n\t params: ${JSON.stringify(
          id
        )} `
      )
      throw error
    }
  }

  logToDB(model, id, action, user, before, after, delta = {}) {
    const afterRecord = stripArrays(after)

    const sql = `insert into HistoryLog 
      (tableName, tableKey, userName, eventDate, description, before, after, diff) 
      values ('${model}', ${id}, '${user}', GETDATE (), '${action}', '${JSON.stringify(
      before
    )}', 
      '${JSON.stringify(afterRecord)}', '${JSON.stringify(delta)}')`
    this.query(sql)
  }

  async query(sql, parameters, next) {
    try {
      const result = await this.db.query(sql, parameters)
      return result
    } catch (error) {
      console.error(
        `Error in query(): ${error} \n\t sql: ${sql} \n\t params: ${JSON.stringify(
          parameters
        )} `
      )
      throw error
    }
  }

  getTransaction() {
    return this.db.getTransaction()
  }
}

module.exports = Controller
