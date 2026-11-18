// Health and readiness endpoint for the Migrations service.
// GET /health -> 200 once the process is up (Railway's health check).
// GET /ready  -> 200 with the Latitude version once migrations are applied, else 503.
"use strict"
const fs = require("node:fs")
const state = process.argv[2]
require("node:http")
  .createServer((req, res) => {
    let v = ""
    try { v = fs.readFileSync(state, "utf8").trim() } catch {}
    if ((req.url || "").startsWith("/ready")) {
      res.writeHead(v ? 200 : 503, { "content-type": "text/plain" })
      return res.end(v || "migrating\n")
    }
    res.writeHead(200, { "content-type": "text/plain" })
    res.end(v ? "migrated " + v + "\n" : "migrating\n")
  })
  .listen(Number(process.env.PORT || 8080), () => console.log("ready-server on :" + (process.env.PORT || 8080)))
