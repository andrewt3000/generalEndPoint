//schema variable can be set by database, hard coded for testing, etc.
var schema = {}

exports.setSchema = function(mySchema) {
  schema = mySchema
}

exports.isValidTable = function(tableName){
  if (schema[tableName.toLowerCase()]) {
    return true
  }
  return false
}

exports.isValidColumn = function(tableName, columnName, joins = []){
  const column = schema[tableName.toLowerCase()].columns.find(
    col => col.name === columnName.toLowerCase()
  )
  if (column) return true
  for (const joinTable of joins) {
    if (columnName.toLowerCase() === `${joinTable}name`.toLowerCase())
      return true
  }
  return false
}
