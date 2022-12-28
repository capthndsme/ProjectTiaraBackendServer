const http = require("node:http");
const fs = require("fs")
const express = require('express');
const config = require("./config");
const Connection = require("./src/database/Connection")
const {Server} = require("socket.io")
const WebSocketHost = require("./src/ws/WebSocketHost");


// Init stuff
const app = express();
app.use(express.json())
const server = http.createServer(app)
const connection = new Connection(config.db);
connection.initialise();
const wsh = new WebSocketHost(server, connection.getConnection())

// Route registration
let before = performance.now()
console.log("[Debug] Registering routes...")
fs.readdirSync('./src/routes/').forEach(file => {
    // Require each file in the folder and pass the app object to the exported function
    require(`./src/routes/${file}`)(app, connection.getConnection())
})
console.log("[Debug] Routes registered, %sms", (performance.now() - before).toFixed(2))

// Server init
server.listen(config.app.port)
console.log(`Project tiara running at ${config.app.port}`)