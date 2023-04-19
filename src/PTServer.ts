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