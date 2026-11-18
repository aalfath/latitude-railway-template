// Minimal SMTP sink for Latitude's "mailpit" transport (used only when no SMTP or Mailgun is
// configured). It accepts mail on 127.0.0.1 and prints each message's recipient, subject,
// plain-text body and links to stdout, i.e. to the Railway deploy logs of the Workers service.
// Only people with access to the Railway project can read those logs.
"use strict"
const net = require("node:net")
const PORT = Number(process.env.LOG_MAILER_PORT || process.env.LAT_MAILPIT_PORT || 2525)

const qp = (s) => s.replace(/=\r?\n/g, "").replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
const decode = (body, cte) => {
  cte = (cte || "").toLowerCase()
  if (cte === "base64") return Buffer.from(body.replace(/\s+/g, ""), "base64").toString("utf8")
  if (cte === "quoted-printable") return Buffer.from(qp(body), "latin1").toString("utf8")
  return body
}
const split = (raw) => {
  const i = raw.search(/\r?\n\r?\n/)
  const head = i < 0 ? raw : raw.slice(0, i)
  const body = i < 0 ? "" : raw.slice(i).replace(/^\r?\n\r?\n/, "")
  const headers = {}
  for (const line of head.replace(/\r?\n[ \t]+/g, " ").split(/\r?\n/)) {
    const m = line.match(/^([^:]+):\s*(.*)$/)
    if (m) headers[m[1].toLowerCase()] = m[2]
  }
  return { headers, body }
}
const parts = (raw, out = []) => {
  const { headers, body } = split(raw)
  const ct = headers["content-type"] || "text/plain"
  const b = ct.match(/boundary="?([^";]+)"?/i)
  if (/^multipart\//i.test(ct) && b) {
    for (const p of body.split("--" + b[1]).slice(1)) if (!p.startsWith("--")) parts(p.replace(/^\r?\n/, ""), out)
  } else out.push({ type: ct.split(";")[0].trim().toLowerCase(), text: decode(body, headers["content-transfer-encoding"]) })
  return out
}
const decodeWord = (s) =>
  (s || "").replace(/=\?([^?]+)\?([bqBQ])\?([^?]*)\?=/g, (_, cs, enc, txt) =>
    enc.toUpperCase() === "B" ? Buffer.from(txt, "base64").toString("utf8") : Buffer.from(qp(txt.replace(/_/g, " ")), "latin1").toString("utf8"))

const report = (rcpts, raw) => {
  try {
    const { headers } = split(raw)
    const ps = parts(raw)
    const text = (ps.find((p) => p.type === "text/plain") || ps[0] || { text: "" }).text
    const html = (ps.find((p) => p.type === "text/html") || { text: "" }).text
    const links = [...new Set([...(text + "\n" + html).matchAll(/https?:\/\/[^\s"'<>)]+/g)].map((m) => m[0].replace(/&amp;/g, "&")))]
      .filter((u) => !/\.(png|jpe?g|gif|svg|webp)(\?|$)/i.test(u))
    const lines = [
      "===== EMAIL (not sent: no SMTP or Mailgun configured; see the template README) =====",
      "To: " + rcpts.join(", "),
      "Subject: " + decodeWord(headers.subject),
      ...text.trim().split(/\r?\n/).slice(0, 40).map((l) => "| " + l),
      ...links.slice(0, 10).map((u) => "Link: " + u),
      "===== END EMAIL =====",
    ]
    console.log(lines.join("\n"))
  } catch (e) {
    console.log("log-mailer: could not parse a message: " + e.message)
  }
}

net
  .createServer((sock) => {
    let buf = "", data = null, rcpts = []
    const say = (l) => sock.write(l + "\r\n")
    say("220 latitude-log-mailer ESMTP")
    sock.on("error", () => {})
    sock.on("data", (chunk) => {
      buf += chunk.toString("latin1")
      while (true) {
        if (data !== null) {
          const end = buf.indexOf("\r\n.\r\n")
          if (end < 0) { if (buf.length > 20e6) sock.destroy(); return }
          data += buf.slice(0, end)
          buf = buf.slice(end + 5)
          report(rcpts, Buffer.from(data.replace(/\r\n\.\./g, "\r\n."), "latin1").toString("utf8"))
          data = null; rcpts = []
          say("250 OK: printed to logs")
          continue
        }
        const i = buf.indexOf("\r\n")
        if (i < 0) return
        const line = buf.slice(0, i); buf = buf.slice(i + 2)
        const cmd = line.slice(0, 4).toUpperCase()
        if (cmd === "EHLO") { say("250-latitude-log-mailer"); say("250-8BITMIME"); say("250 SMTPUTF8") }
        else if (cmd === "HELO") say("250 latitude-log-mailer")
        else if (cmd === "MAIL") { rcpts = []; say("250 OK") }
        else if (cmd === "RCPT") { const m = line.match(/<([^>]*)>/); rcpts.push(m ? m[1] : line.slice(8)); say("250 OK") }
        else if (cmd === "DATA") { data = ""; say("354 End data with <CR><LF>.<CR><LF>") }
        else if (cmd === "RSET") { rcpts = []; say("250 OK") }
        else if (cmd === "NOOP") say("250 OK")
        else if (cmd === "QUIT") { say("221 Bye"); sock.end() }
        else say("502 Command not implemented")
      }
    })
  })
  .listen(PORT, "127.0.0.1", () => console.log("log-mailer listening on 127.0.0.1:" + PORT))
