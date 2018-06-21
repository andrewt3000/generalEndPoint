

exports.stripArrays = function(body) {
  const record = {}
  for (const property in body) {
    if (!Array.isArray(body[property])) {
      record[property] = body[property]
    }
  }
  return record
}
