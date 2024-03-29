import { Socket } from "socket.io";
import { DeviceState } from "../types/DeviceState";
import { DeviceStateUpdate } from "../types/DeviceStateUpdate";
import { DeviceBaseToggle } from "../types/DeviceBaseToggle";

interface ClientSocket {
   clientSession: string; 
   socket: Socket
   currentSubscribedDeviceHwid: string | undefined;
}

let _clientSockets: ClientSocket[] = [];

export function findAuthenticatedClientSocket(clientSession: string): ClientSocket | undefined {
   return _clientSockets.find((cs) => cs.clientSession === clientSession);
}

export function setClientSubscribedDeviceHwid(clientUsername: string, deviceHwid: string | undefined): boolean {
   const clientSocket = findAuthenticatedClientSocket(clientUsername);
   if (clientSocket) {
      clientSocket.currentSubscribedDeviceHwid = deviceHwid;
      return true;
   } else {
      
      return false;
   }
}
export function setClientSubscribedDeviceHwidSocket(cs: Socket, deviceHwid: string | undefined): boolean {
   
   // find our clientSocket in our local Array
   const clientSocket = _clientSockets.find((c) => c.socket === cs);
   if (clientSocket) {

      clientSocket.currentSubscribedDeviceHwid = deviceHwid;
      return true;
   } else {
      
      return false;
   }
}

export function addToAuthenticatedClientSocketList(clientSession: string, socket: Socket) {
   // Actually, we don't need to check if the client already has a socket.
   // We will just allow multiple connections for the same Session.
   //It is up for debate whenever we allow same sessions multiple connections 
   // (Basically, same session multiple connections means multiple tabs)
   /* if (findAuthenticatedClientSocket(clientSession) !== undefined) {
      console.log("Client already has socket, lets override the client socket.");
      _clientSockets = _clientSockets.map((cs) => {
         if (cs.clientSession === clientSession) {
            // Disconnect the old socket.
            cs.socket.disconnect();
            // Set the new socket.
            cs.socket = socket;
         } 
         return cs;
      });
   } */
   _clientSockets.push({ clientSession, socket, currentSubscribedDeviceHwid: undefined });
}
export function removeAuthenticatedClientSocket(socket: Socket) {
   _clientSockets = _clientSockets.filter((cs) => cs.socket !== socket);
}

export function sendStateToSubscribedClient(deviceHwid: string, deviceState: DeviceStateUpdate) {
  //console.log("Sending state to subscribed client.", deviceState);
   _clientSockets.forEach((cs) => {
      
      if (cs.currentSubscribedDeviceHwid === deviceHwid) {
         console.log("Client subscribed to this socket", deviceHwid);
         cs.socket.emit("deviceStateUpdate", deviceState);
      }
   });
}

export function sendToggleStateToClientExceptSelf(s: Socket, deviceHwid: string, toggleStateUpdate: DeviceBaseToggle) {
   console.log("Sending partial state to subscribed client.", toggleStateUpdate);
   _clientSockets.forEach((cs) => {
      if (cs.currentSubscribedDeviceHwid === deviceHwid && cs.socket !== s) {
         console.log("Client subscribed to this socket", deviceHwid);
         cs.socket.emit("toggleStateUpdate", toggleStateUpdate);
      }
   });
}

export function broadcastMessageToHWID(deviceHwid: string, message: string, data?: any) {
   console.log("Sending message to subscribed client.", message);
   _clientSockets.forEach((cs) => {
      if (cs.currentSubscribedDeviceHwid === deviceHwid) {
         console.log("Client subscribed to this socket", deviceHwid);
         cs.socket.emit(message, data);
      }
   });
}

 

export function sendToggleStateToClient( deviceHwid: string, toggleStateUpdate: DeviceBaseToggle) {
   console.log("Sending partial state to subscribed client.", toggleStateUpdate);
   _clientSockets.forEach((cs) => {
      if (cs.currentSubscribedDeviceHwid === deviceHwid) {
         console.log("Client subscribed to this socket", deviceHwid);
         cs.socket.emit("toggleStateUpdate", toggleStateUpdate);
      }
   });
}

export function findSubscribedClientSocket(deviceHwid: string): ClientSocket | undefined {
   return _clientSockets.find((cs) => cs.currentSubscribedDeviceHwid === deviceHwid);
}

 
export function disconectAllClientsWithSession(clientSession: string) {
   _clientSockets.forEach((cs) => {
      if (cs.socket.data.session === clientSession) {
         console.log("This session matches the session we want to remove. Disconnecting.")
         cs.socket.disconnect();
      }
   });
}
export function getSocketsList() {
   return _clientSockets;
}