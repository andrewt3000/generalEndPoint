const controller = require("./controller")
const { Router } = require("express")
const router = new Router()

router.route("/count/:model").post((...args) => controller.count(...args))

router
  .route("/:model")
  .get((...args) => controller.findAll(...args))
  .post((...args) => controller.findByQuery(...args))
  .put((...args) => controller.save(...args))

router
  .route("/:model/:id")
  .get((...args) => controller.findById(...args))
  .delete((...args) => controller.remove(...args))

module.exports = router
