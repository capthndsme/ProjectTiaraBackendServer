import { Socket } from "socket.io";
import { CheckDeviceSessionValidity } from "../dbops/CheckDeviceSessionValidity";
import { addToDeviceSocketList, findDeviceSocket } from "./DeviceSocketList";
import { removeFromDeviceSocketList } from "./DeviceSocketList";
import { DeviceState } from "../types/DeviceState";
import { sendStateToSubscribedClient } from "./ClientSocketList";
import {
	deviceConnected,
	getDeviceState,
	markDeviceAsOffline,
	markDeviceAsOnline,
	mutateState,
	updateDeviceState,
} from "../components/DeviceStateCache";
import { DeviceStateUpdate } from "../types/DeviceStateUpdate";
import { DeviceBaseToggle } from "../types/DeviceBaseToggle";
import { removeFromDeviceStreamList } from "../rtmp/DeviceStreams";
import { ToggleResult } from "../types/ToggleResult";
import { NotificationEntity } from "../types/NotificationEntity";
import { FirebaseNotificationHook } from "../components/FirebaseNotificationHook";
import { InsertNotification } from "../dbops/InsertNotification";
import { WriteMetric } from "../dbops/WriteMetric";

export function DeviceEvents(socket: Socket): void {
	console.log("[Debug] Device socket connected, start verification.");
	CheckDeviceSessionValidity(
		socket.handshake.query.deviceHwid.toString(), // This is the device's HWID, cast it to a string.
		socket.handshake.query.deviceToken.toString()
	)
		.then((res) => {
			if (res.success) {
				/**
				 * Our device sends a heartbeat every 30 seconds,
				 * it means a metric is written to the database every 30 seconds.
				 * Lets throttle it to every 5 minutes.
				 */
				socket.data.metricsThrottle = 0;
				console.log("[Debug] Device socket authenticated successfully.");
				markDeviceAsOnline(socket.handshake.query.deviceHwid.toString());
				socket.data.deviceNumber = res.deviceId;
				deviceConnected(socket.handshake.query.deviceHwid.toString()).then((res) => {
					addToDeviceSocketList(socket.handshake.query.deviceHwid.toString(), socket);
					socket.on("heartbeat", (data, callback) => {
						console.log("Heartbeat received from client " + socket.handshake.query.deviceHwid, "optional data", data);
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
							// This is a hacky way of writing the metric to the database.
							// Check if our last metric write was more than 5 minutes ago.
							if (Date.now() - socket.data.metricsThrottle > 1000 * 60 * 5) {
												WriteMetric(
									Date.now(),
									"TEMP_COMBINED",
									JSON.stringify({
										inside: {
											temperature: deviceState.deviceSensors?.Thermometers?.Inside?.Temperature,
											humidity: deviceState.deviceSensors?.Thermometers?.Inside?.Humidity,
										},
										outside: {
											temperature: deviceState.deviceSensors?.Thermometers?.Outside?.Temperature,
											humidity: deviceState.deviceSensors?.Thermometers?.Outside?.Humidity,
										},
										cpu: {
											temperature: deviceState.deviceSensors?.Thermometers?.CPU?.Temperature,
										},
									}),
									socket.data.deviceNumber
								).then(() => {
									console.log("Wrote metric to database.");
									socket.data.metricsThrottle = Date.now(); // Note the time of the last metric write.
								});
							} else {
								console.log("Metric write throttled.", Date.now() - socket.data.metricsThrottle);
							}
				
						});
						markDeviceAsOnline(socket.handshake.query.deviceHwid.toString());
						sendStateToSubscribedClient(
							socket.handshake.query.deviceHwid.toString(),
							getDeviceState(socket.handshake.query.deviceHwid.toString())
						);
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

	socket.on("DeadStreamEvent", () => {
		socket.data.lastDeadStreamEvent = Date.now();
		// Anti spam - 1 event per 10 seconds.
		if (Date.now() - socket.data.lastDeadStreamEvent > 1000 * 10) {
			// 10 seconds have not passed since last event
			// Additonally, return and extend the timer.
			socket.data.lastDeadStreamEvent = Date.now();
			return;
		}

		console.log("Stream died, invalidating device stream.");

		removeFromDeviceStreamList(socket.handshake.query.deviceHwid.toString());
	});
	socket.on("PushNotification", (data: NotificationEntity, callback) => {
		if (data && data.title && data.message && data.type) {
			// Valid notification received from device.
			// Push it to Firebase using our FirebaseNotificationHook component.
			// which is still TODO. But it won't error out.
			FirebaseNotificationHook(data);
			InsertNotification(data, socket.handshake.query.deviceHwid.toString()).then((state) => {
				console.log("Notification saved to database state", state);

				callback({
					success: state,
				});
			});
		} else {
			console.warn("Invalid notification received from device. Discarding! Check NotificationEntity type for more information.");
			console.warn(data);
			return;
		}
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

export function sendToggleToDevice(deviceHwid: string, toggleStateUpdate: DeviceBaseToggle): Promise<ToggleResult> {
	return new Promise((resolve) => {
		const socket = findDeviceSocket(deviceHwid);
		if (!socket) {
			console.log(`Device ${deviceHwid} is offline.`);
			resolve({
				success: false,
				message: "Device is offline.",
			});
			return;
		}
		// A 40-second delay for the device to perform the assigned action.
		socket.socket.timeout(40000).emit("ToggleStateMutate", toggleStateUpdate, (hasError, data: ToggleResult) => {
			if (hasError) {
				console.warn("Device did not respond to toggle state mutate request.");
				resolve({
					success: false,
					message: "Device did not respond to toggle state mutate request.",
				});
				return;
			}
			console.log("Toggle state mutate response from device: ", data);
			// Pass-through the response from the device.
			resolve(data);
		});
	});
}
