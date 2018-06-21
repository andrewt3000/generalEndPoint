const { Router } = require("express")
const router = new Router()

const user = require("./model/user/router")
const general = require("./model/general/router")

router.route("/").get((req, res) => {
  res.json({ message: "GE API" })
})

router.use("/users", user)
router.use("/general", general)

router.use("*", (req, res) => res.status(404).json({ message: "Not Found" }))

module.exports = router
