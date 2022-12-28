const {Server} = require("socket.io");

class WebSocketHost {
    _io; 
    constructor(server) {
        this._io = new Server(server);
        console.log("[Debug] WebSocket Server initialised")
    }
    getSocket() {
        return _io
    }
 
}
module.exports = WebSocketHost