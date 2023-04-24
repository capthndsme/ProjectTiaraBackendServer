import { Socket } from "socket.io";
import { CheckPassword } from "../dbops/CheckPassword";
import { CheckSessionWithID } from "../dbops/CheckSessionWithID";
import { CreateSession } from "../dbops/CreateSession";
import { GetOwnedDevices } from "../dbops/GetOwnedDevices";

import {
	addToAuthenticatedClientSocketList,
	removeAuthenticatedClientSocket,
	sendToggleStateToClientExceptSelf,
	setClientSubscribedDeviceHwidSocket,
} from "./ClientSocketList";
import { getDeviceState, getOrLoadDeviceState, mutateState } from "../components/DeviceStateCache";
import { ToggleStateMutate } from "../types/ToggleStateMutate";
import { DeviceBaseToggle } from "../types/DeviceBaseToggle";
import { sendToggleToDevice } from "./DeviceEvents";
import { findDeviceSocket, getDeviceSchedulerData } from "./DeviceSocketList";
export function ClientEvents(socket: Socket): void {
	function authDisconnect() {
		console.log("[Debug] Client socket authentication timed-out.");
		socket.disconnect();
	}
	let authTimeout = setTimeout(authDisconnect, 60000);
	console.log("[Debug] Client socket connected, start verification.");
	socket.on("authenticate", (data, callback) => {
		if (data.username && data.session) {
			CheckSessionWithID(data.username, data.session).then((res) => {
				if (res) {
					console.log("[Debug] Client socket authenticated successfully.");
					addToAuthenticatedClientSocketList(data.username, socket);
					socket.data.username = data.username;
					socket.data.authenticated = true;
					callback({ success: true, accountId: res.accountId });
					clearTimeout(authTimeout);
					// Null the timeout so we don't accidentally disconnect the socket.
					authTimeout = null;
				} else {
					console.log("[Debug] Client socket authentication failed.");
					callback({ success: false, error: "AUTH_FAIL" });
				}
			});
		}
	});
	socket.on("AuthenticationKeepalive", (data, callback) => {
		// It is a simple event to signal our backend that the client is in the login screen,
		// hence we can stop the authentication timeout.
		console.log("AuthenticationKeepalive received, extending timeout.");
		// Check if the timeout is not null, if it is, we don't need to do anything.
		// Null means that the socket is already authenticated.
		if (authTimeout) {
			clearTimeout(authTimeout);
			authTimeout = setTimeout(authDisconnect, 60000);
		} else {
			console.log(
				"AuthenticationKeepalive received, but the socket is already authenticated. Ignoring so we don't accidentally disconnect the socket."
			);
		}
	});

	socket.on("SubscribeToHardware", (data, callback) => {
		if (!socket.data.authenticated) return;
		if (data.hwid && socket.data.authenticated) {
			console.log("[WebSocketHost] Subscribing to hardware", data.hwid);
			setClientSubscribedDeviceHwidSocket(socket, data.hwid);
			callback({ success: true });
		}
	});

	socket.on("login", (data, callback) => {
		if (data.username && data.password) {
			CheckPassword(data.username, data.password).then((res) => {
				if (res.status) {
					console.log("[Debug] Client socket logged in successfully.");
					socket.data.username = data.username;

					CreateSession(res.accountId, data.username, socket.handshake.address).then((sessionHash) => {
						callback({
							success: true,
							accountId: res.accountId,
							session: sessionHash,
						});
						socket.data.authenticated = true;
						addToAuthenticatedClientSocketList(data.username, socket);
						clearTimeout(authTimeout);

						authTimeout = null;
					});
				} else {
					console.log("[Debug] Client socket login failed.");
					callback({
						success: false,
					});
				}
			});
		}
	});
	socket.on("requestDeviceList", (data, callback) => {
		// requestDeviceList is called when the client wants to get a list of devices that they own.
		if (!socket.data.authenticated) return;
		GetOwnedDevices(data.accountId)
			.then((res) => {
				console.log("[WebSocketHost] devices", res);

				if (res.devices.length !== 0) {
					// We will automatically subscribe to the first device in the list.
					socket.data.subscribedDeviceHwid = res.devices[0].DeviceHWID;
					setClientSubscribedDeviceHwidSocket(socket, res.devices[0].DeviceHWID);
					// Since we subscribed to the first device, we will also ask the device to send us the latest data.
					// This is done by emitting a "requestLatestData" event to the device.
					// The device will then respond with a "latestData" event.
					// The client will then receive the latest data and update the UI.
				}

				console.log("Loading devices as well");
				getOrLoadDeviceState(res.devices[0].DeviceHWID)
					.then((state) => {
						console.log("Returning device list");
						socket.data.localSync = setInterval(() => {
							socket.emit("deviceStateUpdate", getDeviceState(socket.data.subscribedDeviceHwid));
						}, 30000); // Send a periodic update to the client about their subscribed device every 30 seconds.
						callback({
							success: true,
							devices: res.devices,
							firstDeviceStateCache: state,
						});
					})
					.catch((e) => {
						console.log("Returning device list with cache fail");
						callback({
							success: true,
							devices: res.devices,
							firstDeviceStateCache: undefined,
						});
					});
			})
			.catch((e) => {
				console.error("Failed to get devices.", e);
				callback({
					success: false,
					devices: [],
				});
			});
	});
	socket.on("setActiveDevice", (data, callback) => {
		if (!socket.data.authenticated) return;
		console.log("[WebSocketHost] setActiveDevice", data);
		socket.data.subscribedDeviceHwid = data.hwid;
		setClientSubscribedDeviceHwidSocket(socket, data.hwid);
	});
	// Get Scheduler Data For Subscribed Device (SchedGetSD)
	// The *SD functions mean that we will use the client's subscribed device.
	socket.on("SchedGetSD", (data, callback) => {
		if (!socket.data.authenticated) return;
		console.log("[WebSocketHost] Get Triggers For Subscribed Device", socket.data.subscribedDeviceHwid);
		getDeviceSchedulerData(socket.data.subscribedDeviceHwid).then((res) => {
			callback({
				success: true,
				data: res
			})
		})
		.catch(e=> {
			callback({
				success: false,

			})
		})
	})

	socket.on("ToggleStateMutate", (data: ToggleStateMutate, callback) => {
		console.log("[WebSocketHost] ToggleStateMutate", data);
		if (!socket.data.authenticated) return;
      if (!findDeviceSocket(socket.data.subscribedDeviceHwid)) {
         callback({
            toggleSuccess: false,
            toggleError: "Device is offline."
         })
         return;
      }
		console.log("[WebSocketHost] ToggleStateMutate", data);
		
		const local: DeviceBaseToggle = {
			toggleName: data.toggleName,
			toggleValue: data.toggleValue,
			toggleType: null, // Not needed for live toggle updates
			lastChanged: Date.now(),
		};
		// A better idea might be introducing a new TypeScript type for updates
		// which don't require all DeviceBaseToggle fields to be present.
		sendToggleStateToClientExceptSelf(socket, socket.data.subscribedDeviceHwid, local); // We do not need to wait for other clients to ack.
		// Uncomment this for debugging... (Sends the toggle state to the client that sent the toggle state)
		//sendToggleStateToClient(socket.data.subscribedDeviceHwid, local)
		sendToggleToDevice(socket.data.subscribedDeviceHwid, local).then((res) => {
         if (res) {
            mutateState(socket.data.subscribedDeviceHwid, (deviceState) => {
               console.log("Mutator", deviceState);
               for (let i = 0; i < deviceState.deviceToggles.length; i++) {
                  if (deviceState.deviceToggles[i].toggleName === data.toggleName) {
                     deviceState.deviceToggles[i].toggleValue = data.toggleValue;
                     deviceState.deviceToggles[i].lastChanged = Date.now();
                  }
               }
               return deviceState;
            });
         } else {
            const failed: DeviceBaseToggle = {
               toggleName: data.toggleName,
               toggleValue: !data.toggleValue, // Invert since failed.
					toggleType: null, // We don't know the type of the toggle since it failed.
               lastChanged: Date.now(),
            };
            sendToggleStateToClientExceptSelf(socket, socket.data.subscribedDeviceHwid, failed);
				
				//sendToggleStateToClient(socket.data.subscribedDeviceHwid, failed) 
				
         }
			callback({
				toggleName: data.toggleName,
				toggleValue: data.toggleValue,
				toggleSuccess: res,
			});
         
         
		});
	});
	socket.on("disconnect", () => {
		console.log("[Debug] Client socket disconnected.");
		clearTimeout(authTimeout);
		clearInterval(socket.data.localSync);
		removeAuthenticatedClientSocket(socket);
		console.log("Unloading all listeners from socket.");
		socket.removeAllListeners();
	});
}
