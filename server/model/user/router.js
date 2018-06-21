const controller = require("./controller")
const Router = require("express").Router
const router = new Router()

router.route("/profile").get((...args) => controller.getProfile(...args))

module.exports = router
