import { startListening } from "./web/ExpressInstance";
import * as DBConnection from "./database/Connection";
import { initialiseWSH } from "./ws/WebSocketHost";
import { startStreamingServer } from "./rtmp/StreamServer";
console.log("[PTServer] Initialising PTServer.")
DBConnection.initialise()
startListening();
initialiseWSH(); 
startStreamingServer();
console.log("[PTServer] Initialised PTServer.")

/**
 * WARNING: The server has insecure settings, like having CORS enabled for all origins.
 * This allows for any website to make requests to the server, and is a security risk.
 * 
 * This is only enabled for development purposes, and should be disabled in production.
 * We enable CORS for all origins because it is still in very early development.
 * 
 * @todo Disable CORS in production, after we finish defending the paper!
 */