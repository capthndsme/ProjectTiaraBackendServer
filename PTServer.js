const http = require("http");
const express = require('express');
const config = require("./config");
const Connection = require("./src/database/Connection")
const {Server} = require("socket.io")
const WebSocketHost = require("./src/ws/WebSocketHost")


// Init stuff
const app = express();
const server = http.createServer(app)
const connection = new Connection(config.db);
const wsh = new WebSocketHost(server)
connection.initialise();

// Server init
server.listen(config.app.port)

// Route registration

console.log(`Project tiara running at ${config.app.port}`)