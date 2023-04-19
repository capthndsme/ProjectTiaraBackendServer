import { ClientEvents } from "./ClientEvents";
import { DeviceEvents } from "./DeviceEvents";
import { Server } from "socket.io";
import { server } from "../web/ExpressInstance";



let _io = new Server(server, {
        cors: {
            origin: "*",
        },
});



export function initialiseWSH () {
    const cio = _io.of("/client");
    const dio = _io.of("/device");
    console.log("[PTServer WebSocketHost] WebSocket Server initialised")
    _io.on("connection", (socket) => { 
        console.warn("[PTServer WebSocketHost] Connection made to root namespace, disconnecting.")
        socket.disconnect();
    });
    dio.on("connect", DeviceEvents)

    cio.on("connect", ClientEvents);

}
 
