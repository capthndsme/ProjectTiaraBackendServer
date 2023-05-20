import { Socket } from "socket.io";
import { CheckPassword } from "../dbops/CheckPassword";
import { CheckSessionWithID } from "../dbops/CheckSessionWithID";
import { CreateSession } from "../dbops/CreateSession";
import { GetOwnedDevices } from "../dbops/GetOwnedDevices";

import {
	addToAuthenticatedClientSocketList,
	disconectAllClientsWithSession,
	getSocketsList,
	removeAuthenticatedClientSocket,
	sendToggleStateToClientExceptSelf,
	setClientSubscribedDeviceHwidSocket,
} from "./ClientSocketList";
import { getDeviceState, getOrLoadDeviceState, mutateState } from "../components/DeviceStateCache";
import { ToggleStateMutate } from "../types/ToggleStateMutate";
import { DeviceBaseToggle } from "../types/DeviceBaseToggle";
import { sendToggleToDevice } from "./DeviceEvents";
import { findDeviceSocket, getDeviceSchedulerData } from "./DeviceSocketList";
import { findDeviceStream, findOrRequestDeviceStream } from "../rtmp/DeviceStreams";
import { ToggleResult } from "../types/ToggleResult";
import { ToggleWithStatus } from "../types/ToggleWithStatus";
import { ScheduledTask } from "../types/Scheduler";
import { GetDeviceNotifications } from "../dbops/GetDeviceNotifications";
import { NotificationEntity } from "../types/NotificationEntity";
import { Stats, ThermometerStat } from "../types/Stats";
import { GetStats } from "../dbops/GetStats";
import { RemoveSession } from "../dbops/RemoveSession";
import { GetSessions } from "../dbops/GetSessions";
import { GetImagery } from "../dbops/GetImagery";
import { ClearNotifications } from "../dbops/ClearNotifications";
import { GetOrCreateInviteHash } from "../types/GetOrCreateInviteHash";
import { GetInviteDetails } from "../dbops/GetInviteDetails";
import { AcceptInvite } from "../dbops/AcceptInvite";
import { GetDeviceMessages } from "../dbops/GetDeviceMessages";
import { SendMessageToHWID } from "../dbops/SendMessageToHWID";
import { GetAccountDetails, GetAccountDetailsUsername } from "../dbops/GetAccountDetails";
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
				if (res.success) {
					GetAccountDetails(res.accountId).then((accountDetails) => {
						console.log("[Debug] Client socket authenticated successfully.");
						console.log(socket.handshake.headers["x-forwarded-for"]);
						addToAuthenticatedClientSocketList(data.username, socket);
						socket.data.username = data.username;
						socket.data.session = data.session; // store for logout and revokations.
						socket.data.authenticated = true;
						callback({ success: true, accountId: res.accountId, accountDetails: accountDetails });
						clearTimeout(authTimeout);
						// Null the timeout so we don't accidentally disconnect the socket.
						authTimeout = null;
					});
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
					// Typecast to string, because, for some reason, typedefs for this particular header is broken?
					const ip = (socket.handshake.headers["x-forwarded-for"] as string) ?? socket.handshake.address;
					CreateSession(res.accountId, data.username, ip).then((sessionHash) => {
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
						// Mutate the device list to include the latest device state.
						// Fixes cache overriding our device names
						mutateState(res.devices[0].DeviceHWID, (dstate) => {
							dstate.deviceDetails = res.devices[0];
						});
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
		getDeviceSchedulerData(socket.data.subscribedDeviceHwid)
			.then((res) => {
				callback({
					success: true,
					data: res,
				});
			})
			.catch((e) => {
				callback({
					success: false,
				});
			});
	});

	socket.on("ToggleStateMutate", (data: ToggleStateMutate, callback: (d: ToggleWithStatus) => void) => {
		console.log("[WebSocketHost] ToggleStateMutate", data);
		if (!socket.data.authenticated) return;
		if (!findDeviceSocket(socket.data.subscribedDeviceHwid)) {
			const failState: ToggleWithStatus = {
				toggleName: data.toggleName,
				toggleValue: data.toggleValue,
				toggleType: null,
				toggleResult: {
					success: false,
					message: "Device is offline.",
				},
				
			};
			callback(failState);
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
		sendToggleToDevice(socket.data.subscribedDeviceHwid, local).then((res: ToggleResult) => {
			if (res.success) {
				mutateState(socket.data.subscribedDeviceHwid, (deviceState) => {
					console.log("Mutator", deviceState);
					for (let i = 0; i < deviceState.deviceToggles.length; i++) {
						if (deviceState.deviceToggles[i].toggleName === data.toggleName) {
							deviceState.deviceToggles[i].toggleValue = data.toggleValue;
							deviceState.deviceToggles[i].lastChanged = Date.now();
						}
					}
				});
			} else {
				const failed: ToggleWithStatus = {
					toggleName: data.toggleName,
					toggleValue: !data.toggleValue, // Invert since failed.
					toggleType: null, // We don't know the type of the toggle since it failed.
					lastChanged: Date.now(),
					toggleResult: res,
				};
				sendToggleStateToClientExceptSelf(socket, socket.data.subscribedDeviceHwid, failed);

				//sendToggleStateToClient(socket.data.subscribedDeviceHwid, failed)
			}

			callback({
				toggleName: data.toggleName,
				toggleValue: data.toggleValue,
				toggleType: null,
				toggleResult:
					res && typeof res !== "boolean"
						? res
						: {
								success: false,
								message: "Device message - Type verification failed.",
						  },
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
	socket.on("GetParticularSchedule", (data: { scheduleId: string }, callback: any) => {
		if (!socket.data.authenticated) return;
	});

	socket.on(
		"GetStats",
		(
			data: {
				limit?: number;
				offset?: number;

				getByPastDays?: number;
				getByParams?: {
					byDay?: boolean;
					byMonth?: boolean;
					byYear?: boolean;
				};
				getByTimestamp?: number;
			},
			callback: (stats: Array<Stats<any>>) => void
		) => {
			// Since we dont use the data, we can just use never.
			// I don't know if this is a good idea, but it works.
			if (!socket.data.authenticated) return;
			console.log("[WebSocketHost] GetStats", data);
			GetStats(
				socket.data.subscribedDeviceHwid,
				data.limit,
				data.offset,
				data.getByPastDays,
				data.getByParams,
				data.getByTimestamp
			).then((res) => {
				// Pass-through
				callback(res);
			});
		}
	);
	socket.on("AddTriggerDevice", (data: { myTrigger: ScheduledTask }, callback: any) => {
		if (!socket.data.authenticated) return;
		console.log("[WebSocketHost] AddTriggerDevice", data);
		const device = findDeviceSocket(socket.data.subscribedDeviceHwid);
		if (!device) {
			return callback({
				success: false,
				error: "Device is offline.",
			});
		}
		device.socket.timeout(30000).emit("AddTrigger", data.myTrigger, (error: boolean, res: any) => {
			if (error) return callback({ success: false, error: "Timeout" });
			if (res && res.success) {
				callback({
					success: true,
				});
			}
		});
	});
	// This is a test function for latency testing.
	socket.on("RapidLatencyTest", (data: any, callback) => {
		callback();
	});
	socket.on("GetNotifications", (data: { limit?: number; page?: number }, callback) => {
		if (!socket.data.authenticated) return;
		console.log("[WebSocketHost] GetNotifications", data);
		GetDeviceNotifications(socket.data.subscribedDeviceHwid, data.limit, data.page).then((res: Array<NotificationEntity>) => {
			console.log("notification request success");
			callback({
				success: true,
				data: res,
			});
		});
	});
	socket.on("StreamRequest", (data: any, callback) => {
		if (!socket.data.authenticated) return;
		console.log("StreamRequestFromClient", data);
		const deviceStream = findOrRequestDeviceStream(socket.data.subscribedDeviceHwid);
		if (!deviceStream) {
			callback({
				success: false,
				error: "Device is offline or connecting.",
			});
			return;
		} else {
			callback({
				success: true,
				data: {
					streamKey: deviceStream.streamId,
				},
			});
		}
	});
	socket.on("LogoutEvent", (data: { session: string; username: string }, callback) => {
		if (!socket.data.authenticated) return;
		console.log("[WebSocketHost] LogoutEvent", data);
		// We don't need to check if the session is valid, since the client will be disconnected anyway.
		// We can just remove the session from the database.
		// We also don't need to check if the session is valid, since the client will be disconnected anyway.
		// We can just remove the session from the database.
		RemoveSession(data.session, data.username).then((res) => {
			// Invalidate client sessions.
			callback();
			disconectAllClientsWithSession(data.session);
		});
	});

	socket.on("GetImages", (data: never, callback) => {
		// For now, no parameters.
		if (!socket.data.authenticated) return;
		console.log("[WebSocketHost] GetImages");
		GetImagery(socket.data.subscribedDeviceHwid).then((res) => {
			callback(res);
		});
	});

	socket.on("GetSessions", (data: never, callback) => {
		if (!socket.data.authenticated) return;
		GetSessions(socket.data.username).then((res) => {
			callback(res);
		});
	});
	socket.on("InvalidateSession", (data: { session: string }, callback) => {
		if (!socket.data.authenticated) return;
		console.log("[WebSocketHost] InvalidateSession", data);
		RemoveSession(data.session, socket.data.username).then((res) => {
			disconectAllClientsWithSession(data.session);
			callback(res);
		});
	});
	socket.on("ClearNotifications", (data: { notificationId?: number }, callback) => {
		if (!socket.data.authenticated) return;
		ClearNotifications(socket.data.subscribedDeviceHwid, data.notificationId).then((res) => {
			callback(res);
		});
	});
	socket.on("ManualPicture", () => {
		if (!socket.data.authenticated) return;
		const device = findDeviceSocket(socket.data.subscribedDeviceHwid);
		if (!device) {
			return;
		}
		device.socket.volatile.emit("ManualPicture");
	});

	socket.on("InviteHashes", (data: never, callback) => {
		if (!socket.data.authenticated) return;
		GetOrCreateInviteHash(socket.data.subscribedDeviceHwid, socket.data.username)
			.then((res) => {
				callback({
					success: true,
					data: res,
				});
			})
			.catch((e) => {
				console.log(e);
				callback({
					success: false,
					message: e,
				});
			});
	});
	socket.on("ResolveInviteHash", (data: { hash: string }, callback) => {
		GetInviteDetails(data.hash)
			.then((res) => {
				callback({
					success: true,
					data: res,
				});
			})
			.catch((e) => {
				console.log(e);
				callback({
					success: false,
					message: "Invalid invite. Ask who invited you for a new invite.",
				});
			});
	});
	socket.on("AcceptInvite", (data: { hash: string }, callback) => {
		if (!socket.data.authenticated) return;
		AcceptInvite(data.hash, socket.data.username)
			.then((res) => {
				callback({
					success: res.success,
					data: res,
					message: res.message,
				});
			})
			.catch((e) => {
				console.log(e);
				callback({
					success: false,
					message: e,
				});
			});
	});
	socket.on("MessagingGet", (data: { limit?: number; before?: number; after?: number }, callback) => {
		if (!socket.data.authenticated) return;
		GetDeviceMessages(socket.data.subscribedDeviceHwid, data.limit, data.before, data.after)
			.then((res) => {
				callback({
					success: true,
					data: res,
				});
			})
			.catch((e) => {
				console.log(e);
				callback({
					success: false,
					message: e,
				});
			});
	});

	socket.on("MessagingSend", (data: { message: string }, callback) => {
		if (!socket.data.authenticated) return;

		SendMessageToHWID(socket.data.subscribedDeviceHwid, socket.data.username, data.message)
			.then((res) => {
				/**
				 * Replicate the message to all other clients that
				 * subscribe to the same device.
				 * but not our own.
				 */

				getSocketsList().forEach((cs) => {
					GetAccountDetailsUsername(socket.data.username).then((rez) => {
						if (
							cs.socket.data.subscribedDeviceHwid === socket.data.subscribedDeviceHwid &&
							cs.socket.data.username !== socket.data.username
						) {
							const msgLocal: Message = {
								msgContent: data.message,
								timestamp: Date.now(),
								Username: socket.data.username,
								messageID: res,
								DisplayImage: rez.DisplayImage,
								sender: rez.AccountID,
								DeviceHWID: socket.data.subscribedDeviceHwid,
							};
							cs.socket.emit("MessagingReceive",msgLocal);
						}
					});
				});
				// Send a success message to the client.
				callback({
					success: true,
					data: "success",
				});
			})
			.catch((e) => {
				console.log(e);
				callback({
					success: false,
					message: "Message write failure.",
				});
			});
	});
}
