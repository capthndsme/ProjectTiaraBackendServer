import { LoadDeviceDetails } from "../dbops/LoadDeviceDetails";
import { createStateCache, loadStateCache, saveStateCache } from "../dbops/Perists";
import { Device } from "../types/Device";
import { DeviceState } from "../types/DeviceState";
import { findDeviceSocket } from "../ws/DeviceSocketList";

let _devices: DeviceState[] = [];

export function getDeviceState(deviceHwid: string): DeviceState | undefined {
	return _devices.find((ds) => ds.deviceDetails.DeviceHWID === deviceHwid);
}

export function getOrLoadDeviceState(deviceHwid: string): Promise<DeviceState | undefined> {
	return new Promise((resolve, reject) => {
		console.log("Our devices in cache", _devices);
		const device = getDeviceState(deviceHwid);
		if (!device) {
			loadStateCache(deviceHwid)
				.then((deviceState) => {
					// This is not mutable.
					// Device is in the cache.
					// Lets check our DeviceSocketList if it is connected.
					const deviceSocket = findDeviceSocket(deviceHwid);
					// A simple ternary operator to check if the device is online.
					deviceState.deviceIsOnline = deviceSocket ? true : false;
					_devices.push(deviceState);
					resolve(deviceState);
				})
				.catch((e) => {
					console.warn("Could not load device state from database", e);
					resolve(undefined);
				});
		} else {
			resolve(device);
		}
	});
}

export function deviceConnected(deviceHwid: string): Promise<void> {
	console.log("Device connected. Lets load the device state from the database.", deviceHwid);
	return new Promise((resolve) => {
		const deviceState = getDeviceState(deviceHwid);
		if (deviceState) {
			// Device is in the cache.
			// Lets check our DeviceSocketList if it is connected.
			const deviceSocket = findDeviceSocket(deviceHwid);
			// A simple ternary operator to check if the device is online.
			deviceState.deviceIsOnline = deviceSocket ? true : false;
			resolve();
		} else {
			// Device is not in the cache, either we can try to get it from the database or we can create a new one.
			console.log("[DSC] Device is not in the cache, either we can try to get it from the database or we can create a new one.");
			loadStateCache(deviceHwid)
				.then((deviceState) => {
					console.log("LoadState", deviceState);
					if (deviceState) {
						console.log("[DSC] Device is in the database, lets add it to the cache.");
						console.log(deviceState);
						_devices.push(deviceState);
						resolve();
					} else {
						console.log("[DSC] Device is not in the database, lets create a new one.");
						const newDeviceState = createDeviceStateTemplate(deviceHwid);
						LoadDeviceDetails(deviceHwid)
							.then((result) => {
								if (result.success) {
									console.log("[DSC] Device details loaded from database: ", result.device);
									if (result.device) newDeviceState.deviceDetails = result.device;
									_devices.push(newDeviceState);
									createStateCache(deviceHwid, newDeviceState);
								} else {
									console.warn("[DSC] Error loading device details from database: setting default values instead...");
									_devices.push(newDeviceState);
									createStateCache(deviceHwid, newDeviceState);
								}
								resolve();
							})
							.catch((e) => {
								console.warn("[DSC] Error loading device details from database: ", e, "setting default values instead...");
								_devices.push(newDeviceState);
								createStateCache(deviceHwid, newDeviceState);
								resolve();
							});
					}
				})
				.catch(() => {
					console.log("[DSC] Device is not in the database, lets create a new one.");
					const newDeviceState = createDeviceStateTemplate(deviceHwid);
					LoadDeviceDetails(deviceHwid)
						.then((result) => {
							if (result.success) {
								console.log("[DSC] Device details loaded from database: ", result.device);
								if (result.device) newDeviceState.deviceDetails = result.device;
								_devices.push(newDeviceState);
								createStateCache(deviceHwid, newDeviceState);
							} else {
								console.warn("[DSC] Error loading device details from database: setting default values instead...");
								_devices.push(newDeviceState);
								createStateCache(deviceHwid, newDeviceState);
							}
							resolve();
						})
						.catch((e) => {
							console.warn("[DSC] Error loading device details from database: ", e, "setting default values instead...");
							_devices.push(newDeviceState);
							createStateCache(deviceHwid, newDeviceState);
							resolve();
						});
				});
		}
	});
}

export function createDeviceStateTemplate(deviceHwid: string): DeviceState {
	// construct a new device state.
	const deviceDetails: Device = {
		DeviceDescription: "",
		DeviceHWID: deviceHwid,
		DeviceID: 0,
		DeviceName: "",
		AccessType: "",
	};
	const createdState: DeviceState = {
		deviceDetails: deviceDetails,
		deviceIsOnline: false,
		deviceToggles: [],
		deviceSensors: undefined,
		deviceLastUpdate: -1, // -1 means never updated.
	};
	return createdState;
}

export function updateDeviceState(deviceState: DeviceState): void {
	_devices = _devices.map((ds) => {
		if (ds.deviceDetails.DeviceHWID === deviceState.deviceDetails.DeviceHWID) {
			return deviceState;
		} else {
			return ds;
		}
	});
	// Save mutated device state to the database.
	saveStateCache(deviceState.deviceDetails.DeviceHWID, deviceState);
}

export function mutateState(deviceHwid: string, mutator: (deviceState: DeviceState) => void): void {
	const deviceState = getDeviceState(deviceHwid);
	if (deviceState) {
		mutator(deviceState);
	}
	// Save mutated device state to the database.
	console.log("State mutated. Saving.");
	saveStateCache(deviceState.deviceDetails.DeviceHWID, deviceState);
}

// I know we could mutate the device state via the updateDeviceState function, but this is a helper function for the device state.
// here is some useful helper functions for the device state.

export function markDeviceAsOffline(deviceHwid: string): void {
	const deviceState = getDeviceState(deviceHwid);
	if (deviceState) {
		deviceState.deviceIsOnline = false;
	}
	saveStateCache(deviceHwid, deviceState);
}

export function markDeviceAsOnline(deviceHwid: string): void {
	const deviceState = getDeviceState(deviceHwid);
	if (deviceState) {
		deviceState.deviceIsOnline = true;
		deviceState.deviceLastUpdate = Date.now();
	}
	saveStateCache(deviceHwid, deviceState);
}
