const http = require("node:http");
const fs = require("fs")
const express = require('express');
const DeviceManager = require("./src/devices/DeviceManager")
const config = require("./config");
const Connection = require("./src/database/Connection")
const {Server} = require("socket.io")
const WebSocketHost = require("./src/ws/WebSocketHost");
const cors = require("cors")

// Init stuff
const app = express();
app.use(express.json())
app.use(cors())
const deviceManager = new DeviceManager();
const server = http.createServer(app)
const connection = new Connection(config.db);
connection.initialise();
const wsh = WebSocketHost(server, connection.getConnection(), deviceManager)

// Route registration
let before = performance.now()
console.log("[Debug] Registering routes...")
fs.readdirSync('./src/routes/').forEach(file => {
    // Require each file in the folder and pass the app object to the exported function
    require(`./src/routes/${file}`)(app, connection.getConnection(), wsh, deviceManager)
})
console.log("[Debug] Routes registered, %sms", (performance.now() - before).toFixed(2))

// Server init
server.listen(config.app.port)
console.log(`Project tiara running at ${config.app.port}`)