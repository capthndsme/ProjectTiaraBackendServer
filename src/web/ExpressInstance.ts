import express from 'express';
import fs from 'node:fs';
import { appConfig } from '../config';
const http = require("node:http");
const cors = require("cors");
export const app = express();
app.use(express.json())
app.use(cors())
export const server = http.createServer(app)

export function startListening(): void {
   console.log("[PTServer Web] Express server listening on port " + appConfig.port)
   server.listen(appConfig.port);
   loadRoutes();
}

function loadRoutes(): void {
   fs.readdirSync(__dirname + "/routes").forEach((file) => {
      // avoid loading .map files (for production mode.)
      if (file.endsWith(".map")) return;
      const route = import(__dirname + "/routes/" + file);
      route.then((r) => {
         console.log("[PTServer Web] Loaded route " + file)
      });
   });
} 

export {express}