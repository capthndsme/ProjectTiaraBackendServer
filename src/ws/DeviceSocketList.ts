import { Socket } from "socket.io";
import { deviceConnected } from "../components/DeviceStateCache";
import { ScheduledTask } from "../types/Scheduler";

interface DeviceSocket {
	deviceHwid: string;
	socket: Socket;
}

let _deviceSockets: DeviceSocket[] = [];

export function findDeviceSocket(deviceHwid: string): DeviceSocket | undefined {
	return _deviceSockets.find((ds) => ds.deviceHwid === deviceHwid);
}

export function addToDeviceSocketList(deviceHwid: string, socket: Socket) {
	_deviceSockets.push({ deviceHwid, socket });
}

export function removeFromDeviceSocketList(socket: Socket) {
	_deviceSockets = _deviceSockets.filter((ds) => ds.socket !== socket);
}

// Below are helper functions for sending device events.

// Request device state update.
// When the device receives this event, it will send a device state update event.
// We should handle the device state event on the DeviceEvents.ts file, then
// we forward the device state event to the client that are subscribed to the device's hwid.

// additionally, deviceStateUpdate is heavier since it sends the entire device state.
// We should create partial updates for deviceToggles, deviceSensors, deviceLastUpdate.
export function requestDeviceStateUpdate(deviceHwid: string) {
	let deviceSocket = findDeviceSocket(deviceHwid);
	if (deviceSocket) {
		deviceSocket.socket.emit("requestDeviceStateUpdate");
	}
}

export function getDeviceSchedulerData(deviceHwid: string): Promise<any> {
	return new Promise((resolve, reject) => {
		let deviceSocket = findDeviceSocket(deviceHwid);
		if (deviceSocket) {
			deviceSocket.socket.timeout(12000).emit("getDeviceScheduler", {}, 
         (err: boolean, data: Array<ScheduledTask>) => {
            console.log("Get Device Scheduler response", err, data)
            if (err) {
               reject();
               return;
            }
            resolve(data);
         });
		} else {
			// Device is not connected.
         console.log("We can't seem to find the device socket for this device. (getDeviceSchedulerData)", deviceHwid, deviceSocket)
			reject();
         return;
		}
	});
}
