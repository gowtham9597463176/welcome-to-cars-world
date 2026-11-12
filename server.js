const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-this-password";
const DATA_FILE = path.join(__dirname, "players.json");

app.use(express.static(path.join(__dirname, "public")));
app.get("/api/health", (_req, res) => res.json({ ok: true, game: "Welcome to Cars World" }));

function readPlayers() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return {}; }
}
function savePlayers() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(profiles, null, 2));
}
const profiles = readPlayers();
const live = new Map();

function publicPlayer(p) {
  return {
    id: p.id, username: p.username, joinedAt: p.joinedAt,
    score: p.score || 0, level: p.level || 1,
    x: p.x || 0, z: p.z || 0, car: p.car || "Neon Starter"
  };
}
function broadcastPlayers() {
  io.to("admins").emit("admin:players", {
    online: [...live.values()].map(publicPlayer),
    registered: Object.keys(profiles).length
  });
}

io.on("connection", socket => {
  socket.on("player:join", (payload, reply) => {
    const username = String(payload?.username || "").trim().replace(/[<>]/g, "").slice(0, 18);
    if (username.length < 2) return reply?.({ ok: false, message: "Name must have at least 2 characters." });
    const id = String(payload?.playerId || "").slice(0, 40) || username.toLowerCase().replace(/\W/g, "-");
    if (!profiles[id]) profiles[id] = { id, username, firstSeen: new Date().toISOString(), totalSessions: 0, totalScore: 0 };
    profiles[id].username = username;
    profiles[id].totalSessions = (profiles[id].totalSessions || 0) + 1;
    const player = {
      id, username, joinedAt: new Date().toISOString(), score: 0, level: 1,
      x: 0, z: 0, rotation: 0, car: "Neon Starter", socketId: socket.id
    };
    live.set(socket.id, player);
    socket.data.playerId = id;
    socket.join("world");
    savePlayers();
    reply?.({ ok: true, player: publicPlayer(player), playerId: id });
    socket.broadcast.to("world").emit("world:joined", publicPlayer(player));
    socket.emit("world:players", [...live.values()].filter(p => p.socketId !== socket.id).map(publicPlayer));
    broadcastPlayers();
  });

  socket.on("player:update", data => {
    const p = live.get(socket.id);
    if (!p) return;
    p.x = Number.isFinite(data?.x) ? Math.max(-500, Math.min(500, data.x)) : p.x;
    p.z = Number.isFinite(data?.z) ? Math.max(-500, Math.min(500, data.z)) : p.z;
    p.rotation = Number.isFinite(data?.rotation) ? data.rotation : p.rotation;
    p.score = Math.max(0, Math.floor(Number(data?.score) || 0));
    p.level = Math.max(1, Math.floor(Number(data?.level) || 1));
    p.car = String(data?.car || p.car).slice(0, 30);
    socket.to("world").emit("world:player-update", publicPlayer(p));
  });

  socket.on("admin:login", (password, reply) => {
    if (String(password) !== ADMIN_PASSWORD) return reply?.({ ok: false, message: "Incorrect admin password." });
    socket.join("admins");
    reply?.({ ok: true, players: [...live.values()].map(publicPlayer), registered: Object.keys(profiles).length });
  });

  socket.on("disconnect", () => {
    const p = live.get(socket.id);
    if (p) {
      socket.broadcast.to("world").emit("world:left", p.id);
      live.delete(socket.id);
      broadcastPlayers();
    }
  });
});

server.listen(PORT, () => console.log(`Cars World running at http://localhost:${PORT}`));
