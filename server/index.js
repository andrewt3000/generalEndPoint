const express = require("express")
const helmet = require("helmet")
const bodyParser = require("body-parser")
const morgan = require("morgan")
const path = require("path")
const jwt = require("express-jwt")
const jwks = require("jwks-rsa")

const config = require("./config")
const routes = require("./routes")

const app = express()

app.use(helmet())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(morgan("tiny"))

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "views")))

const jwtCheck = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: "https://x.auth0.com/.well-known/jwks.json"
  }),
  audience: "https://api.x.com",
  issuer: "https://x.auth0.com/",
  algorithms: ["RS256"]
})

// API routes
app.all("/api/*", jwtCheck)
app.use("/api", routes)

// health check
app.get("/healthcheck", (req, res) => {
  res.send("all good")
})

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"))
})

const server = app.listen(config.server.port, () => {
  console.log(`Magic happens on port ${config.server.port}`)
})

// handle shut down gracefully
// shut down server
function shutdown() {
  server.close(err => {
    if (err) {
      console.error(err)
      process.exitCode = 1
    }
    process.exit()
  })
}

// quit on ctrl-c when running docker in terminal
process.on("SIGINT", () => {
  console.info(
    "Got SIGINT (aka ctrl-c in docker). Graceful shutdown ",
    new Date().toISOString()
  )
  shutdown()
})

// quit properly on docker stop
process.on("SIGTERM", () => {
  console.info(
    "Got SIGTERM (docker container stop). Graceful shutdown ",
    new Date().toISOString()
  )
  shutdown()
})
//
// need above in docker container to properly exit
//

module.exports = app
