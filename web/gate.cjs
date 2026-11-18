// Start gate for the Latitude app services on Railway.
// Railway has no depends_on, so this replaces upstream compose's
//   depends_on: migrations: condition: service_completed_successfully
// It waits until the Migrations service says this release's migrations are applied
// (GET $MIGRATIONS_URL/ready returns the version). Meanwhile it answers Railway's health
// check on $PORT so a slow first boot doesn't fail the deploy, and shows "starting" elsewhere.
"use strict"
const http = require("node:http")
const want = process.env.LATITUDE_VERSION || ""
const base = (process.env.MIGRATIONS_URL || "").replace(/\/+$/, "")
if (!base) { console.error("MIGRATIONS_URL is required (http://<Migrations private domain>:8080)"); process.exit(1) }
const port = Number(process.env.PORT || 0)
let server = null
if (port) {
  server = http.createServer((req, res) => {
    const healthy = /^\/(api\/)?health\/?(\?|$)/.test(req.url || "")
    res.writeHead(healthy ? 200 : 503, { "content-type": "text/plain", "retry-after": "10" })
    res.end(healthy ? "starting\n" : "Latitude is starting: waiting for database migrations. Reload in a minute.\n")
  })
  server.on("error", (e) => { console.log("gate: temporary server not started: " + e.message); server = null })
  server.listen(port)
}
const check = () => new Promise((resolve) => {
  const req = http.get(base + "/ready", { timeout: 5000 }, (res) => {
    let b = ""
    res.on("data", (c) => (b += c))
    res.on("end", () => resolve(res.statusCode === 200 ? b.trim() : ""))
  })
  req.on("timeout", () => req.destroy())
  req.on("error", () => resolve(""))
})
const main = async () => {
  for (let n = 0; ; n++) {
    const v = await check()
    if (v && (!want || v === want)) {
      console.log(`gate: migrations for Latitude ${v} are applied`)
      if (!server) process.exit(0)
      server.close(() => process.exit(0))
      if (server.closeAllConnections) server.closeAllConnections()
      return
    }
    if (n % 6 === 0) console.log(`gate: waiting for Latitude ${want} migrations at ${base}/ready` + (v ? ` (it reports ${v})` : ""))
    await new Promise((r) => setTimeout(r, 5000))
  }
}
main()
