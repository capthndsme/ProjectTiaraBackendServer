import { Socket } from "socket.io";
import { CheckDeviceSessionValidity } from "../dbops/CheckDeviceSessionValidity";
import { addToDeviceSocketList, findDeviceSocket } from "./DeviceSocketList";
import { removeFromDeviceSocketList } from "./DeviceSocketList";
import { DeviceState } from "../types/DeviceState";
import { sendStateToSubscribedClient } from "./ClientSocketList";
import { deviceConnected, getDeviceState, markDeviceAsOffline, markDeviceAsOnline, mutateState, updateDeviceState } from "../components/DeviceStateCache";
import { DeviceStateUpdate } from "../types/DeviceStateUpdate";
import { DeviceBaseToggle } from "../types/DeviceBaseToggle";
import { removeFromDeviceStreamList } from "../rtmp/DeviceStreams";

export function DeviceEvents(socket: Socket): void {
	console.log("[Debug] Device socket connected, start verification.");
	CheckDeviceSessionValidity(
		socket.handshake.query.deviceHwid.toString(), // This is the device's HWID, cast it to a string.
		socket.handshake.query.deviceToken.toString()
	)
		.then((res) => {
			if (res.success) {
				console.log("[Debug] Device socket authenticated successfully.");
				markDeviceAsOnline(socket.handshake.query.deviceHwid.toString());
				deviceConnected(socket.handshake.query.deviceHwid.toString()).then((res) => {
					addToDeviceSocketList(socket.handshake.query.deviceHwid.toString(), socket);
					socket.on("heartbeat", (data, callback) => {
						console.log("Heartbeat received from client " + socket.handshake.query.deviceHwid, "optional data" , data);
						callback({ ts: Date.now() });
					});
					socket.on("SyncDeviceState", (data: DeviceState) => {
						console.log("Device state broadcast received from hardware " + socket.handshake.query.deviceHwid.toString());
						mutateState(socket.handshake.query.deviceHwid.toString(), (deviceState) => {
							console.log("hardware state: ", data);
							console.log("our state: ", deviceState);
                     deviceState.deviceSensors = data.deviceSensors;
                     deviceState.deviceToggles = data.deviceToggles;
 
							console.log("mutated: ", deviceState);
						});
						markDeviceAsOnline(socket.handshake.query.deviceHwid.toString());
						sendStateToSubscribedClient(socket.handshake.query.deviceHwid.toString(), getDeviceState(socket.handshake.query.deviceHwid.toString()));
					});
				});
			} else {
				console.log("[Debug] WebSocketHost Authentication failed.");
				socket.disconnect();
			}
		})
		.catch((e) => {
			console.error("WebSocketHost DB failed.", e);
			socket.disconnect();
		});
	socket.on("disconnect", () => {
		console.log(`Device disconnected.`);
		console.log(socket?.handshake?.query?.deviceHwid);
		removeFromDeviceStreamList(socket.handshake.query.deviceHwid.toString());
		removeFromDeviceSocketList(socket);

		markDeviceAsOffline(socket.handshake.query.deviceHwid.toString());

		socket.disconnect();
	});
}

export function sendToggleToDevice(deviceHwid: string, toggleStateUpdate: DeviceBaseToggle): Promise<boolean> {
   return new Promise(resolve=> {
      const socket = findDeviceSocket(deviceHwid);
      if (!socket) {
         console.log(`Device ${deviceHwid} is offline.`);
         resolve(false);
         return;
      }
      // A 40-second delay for the device to perform the assigned action.
      socket.socket.timeout(40000).emit(
         "ToggleStateMutate",
         toggleStateUpdate,
         (hasError, data) => {
            if (hasError) {
               console.warn("Device did not respond to toggle state mutate request.");
               resolve(false); 
               return;
            }
            console.log("Toggle state mutate response from device: ", data);
            resolve(true);
         }
      )
   });
   
}