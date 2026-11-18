// Guard in front of the Latitude API (runs it as a child process and proxies to it).
// Upstream serves POST /v1/account/bootstrap with no authentication: anyone who finds the API
// URL can create an organization with an API key on your instance. This guard refuses that one
// route unless LAT_ALLOW_ACCOUNT_BOOTSTRAP=true; every other request (REST, MCP streaming,
// health) is passed through untouched, X-Forwarded-For included.
"use strict"
const http = require("node:http")
const { spawn } = require("node:child_process")
const listen = Number(process.env.PORT || 8080)
const target = Number(process.env.LAT_API_PORT || 3001)
const allowBootstrap = String(process.env.LAT_ALLOW_ACCOUNT_BOOTSTRAP || "").toLowerCase() === "true"
if (listen === target) { console.error("api-guard: PORT and LAT_API_PORT must differ"); process.exit(1) }

const [cmd, ...args] = process.argv.slice(2)
const child = spawn(cmd, args, { stdio: "inherit", env: process.env })
child.on("exit", (code, sig) => { console.log(`api-guard: API exited (${sig || code}), stopping`); process.exit(code ?? 1) })
for (const s of ["SIGTERM", "SIGINT"]) process.on(s, () => child.kill(s))

const blocked = (url) => /^\/v1\/account\/bootstrap(\/|\?|$)/i.test(url || "")
http
  .createServer((req, res) => {
    if (!allowBootstrap && blocked(req.url)) {
      res.writeHead(403, { "content-type": "application/json" })
      return res.end(JSON.stringify({ error: "Account bootstrap is disabled on this instance. Create API keys in the web UI." }))
    }
    const up = http.request({ host: "127.0.0.1", port: target, method: req.method, path: req.url, headers: req.headers }, (r) => {
      res.writeHead(r.statusCode || 502, r.headers)
      r.pipe(res)
    })
    up.on("error", () => {
      if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" })
      res.end("API is starting\n")
    })
    req.pipe(up)
    res.on("close", () => up.destroy())
  })
  .listen(listen, () => console.log(`api-guard: :${listen} -> 127.0.0.1:${target} (account bootstrap ${allowBootstrap ? "allowed" : "blocked"})`))
