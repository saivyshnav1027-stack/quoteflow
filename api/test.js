export default function handler(req, res) {
  res.json({ ok: true, now: Date.now(), node: process.version })
}
