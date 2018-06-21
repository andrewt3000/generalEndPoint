const validation = require("./validation")
const { isValidTable, isValidColumn } = require("./validation")

var schema = {
  mytable: {
    columns: [
      { name: "mycolumn" },
      { name: "my_column2" }
    ]
  }
}

validation.setSchema(schema)


test("test validation utils", () => {
    expect(isValidTable("mytable")).toBeTruthy()
    expect(isValidColumn("mytable", "mycolumn")).toBeTruthy()
    expect(isValidColumn("mytable", "my_column2")).toBeTruthy()
    expect(isValidColumn("mytable", "dbo.mycolumn")).toBeFalsy()
    expect(isValidColumn("mytable", "mycolumn--")).toBeFalsy()
    expect(isValidColumn("mytable", "my column")).toBeFalsy()
    expect(isValidColumn("mytable", "mycolumn'")).toBeFalsy()
    expect(isValidColumn("mytable", "mycolumn;")).toBeFalsy()
  })