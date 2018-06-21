const validation = require("./validation")
const { getSelectSql, getCountSql, getUpdateSql, getInsertSql } = require("./")

var schema = {
  statustable: {columns:[{name:"name"}]},
  lookuptable: {columns:[{name:"name"}]},
  mytable: {
    columns: [
      { name: "id" },
      { name: "name" },
      { name: "test" },
      { name: "f1" },
      { name: "f2" },
      { name: "filter" },
      { name: "val" },
      { name: "status"},
      { name: "qty"},
      { name: "qty2"}
    ]
  }
}

validation.setSchema(schema)

const model = "mytable"
const body = {
  fields: ["id", "name", "test"],
  where: { filter: 1, val: 2 },
  joins: ["statusTable", "-lookupTable"],
  orderBy: ["name", "-status"],
  limit: 10,
  offset: 3
}

test("test select", () => {
  expect(getSelectSql(model, body)).toMatch(
    "select mytable.[id], mytable.[name], mytable.[test] , statusTable.name as statusTableName , lookupTable.name as lookupTableName  " +
    "from mytable  inner join  statusTable on statusTable.id = statusTableID  " +
    "left outer join  lookupTable on lookupTable.id = lookupTableID " +
    "where mytable.[filter] = 1  and mytable.[val] = 2 order by [name], [status] DESC OFFSET 3 ROWS  FETCH NEXT 10 ROWS ONLY"
  )

  const whereNotEqual = {where: {qty:{$ne: 1}}}
  expect(getSelectSql(model, whereNotEqual)).toMatch("select mytable.*   from mytable where mytable.[qty] <> 1 ")

  const greaterThan = {where: { qty: { $gt: 20 } }}
  expect(getSelectSql(model, greaterThan)).toMatch("select mytable.*   from mytable where mytable.[qty] > 20 ")

  const greaterThanEqual = {where: { qty: { $gte: 20 } }}
  expect(getSelectSql(model, greaterThanEqual)).toMatch("select mytable.*   from mytable where mytable.[qty] >= 20 ")

  const multiCondition = {where: {qty:{$ne: 1}, status:1, qty2:{$gte:2}}}
  expect(getSelectSql(model, multiCondition)).toMatch("select mytable.*   from mytable where mytable.[qty] <> 1  and mytable.[status] = 1  and mytable.[qty2] >= 2 ")

})

test("test count", () => {
  expect(getCountSql(model, body)).toMatch(
    "select count(*) as count from mytable where mytable.[filter] = 1  and mytable.[val] = 2 "
  )
})

const dataBody = {f1: "yo", f2:"fubar"}
test("test insert", () => {
  expect(getInsertSql(model, dataBody)).toMatch(
    "insert into mytable ([f1], [f2] ) values (@f1, @f2 ); SELECT SCOPE_IDENTITY() AS id"
  )
})

test("test update", () => {
  expect(getUpdateSql(model, dataBody)).toMatch(
    "update mytable set [f1] = @f1, [f2] = @f2 where id = @id"
  )
})

