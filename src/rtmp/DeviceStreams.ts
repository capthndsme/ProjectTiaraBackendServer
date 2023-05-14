import { findDeviceSocket } from "../ws/DeviceSocketList";
import { waitForDeviceToStream } from "./StreamServer";

export type DeviceStream = {
	deviceHwid: string;
	streamId: string;
};

let _deviceStreams: DeviceStream[] = [];
let _deviceLocks: boolean[] = [];
/**
 * a table of generated stream hashes for each device
 */
let _deviceStreamPersist: string[] = [];
export function findDeviceStream(deviceHwid: string): DeviceStream | undefined {
	return _deviceStreams.find((ds) => ds.deviceHwid === deviceHwid);
}

// This returns undefined when, either the device is offline or the device is online but the device did not send a stream request.
export function findOrRequestDeviceStream(deviceHwid: string): DeviceStream {
	console.log("findOrRequestDeviceStream");
	console.log("DeviceStreams: ", _deviceStreams);

	let deviceStream = findDeviceStream(deviceHwid);
	if (deviceStream === undefined) {
		// Request stream from device.
		console.log("Generating stream key for device.");

		console.log("Non-existing stream for device, requesting stream from device.");
		const generatedStreamKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		// Early create a stream key for the device.
		// TODO: We should allow our system to rotate stream keys.

		const device = findDeviceSocket(deviceHwid);
		if (device) {
			addToDeviceStreamList(deviceHwid, generatedStreamKey);
			findDeviceSocket(deviceHwid)
				?.socket.timeout(7500)
				.emit(
					"CameraStreamRequest",
					{
						streamKey: generatedStreamKey,
					},
					(error, data: any) => {
						waitForDeviceToStream(deviceHwid).then(() => {
							if (error) {
								console.log("Error requesting stream from device.");
								_deviceLocks[deviceHwid] = false;
								return undefined;
							}
							if (data && data.success) {
								_deviceLocks[deviceHwid] = false;
								console.log("Received response, adding stream to device stream list.");
								addToDeviceStreamList(deviceHwid, generatedStreamKey);
								deviceStream = findDeviceStream(deviceHwid);
								return undefined;
							} else {
								_deviceLocks[deviceHwid] = false;
								console.log("Device did not send a stream request.");
								return undefined;
							}
						});
					}
				);
		} else {
			console.log("Device is offline.");
			_deviceLocks[deviceHwid] = false;
			return undefined;
		}
	} else {
		console.log("Existing stream for device %s, returning stream. ", deviceHwid);
		findDeviceSocket(deviceHwid)
			?.socket.volatile.timeout(7500)
			.emit("CameraStreamRequest", {}, () => {
				console.log("Device is online");
			});
		return deviceStream;
	}
}

export function addToDeviceStreamList(deviceHwid: string, streamId: string): void {
	if (findDeviceStream(deviceHwid) === undefined) {
		_deviceStreams.push({ deviceHwid, streamId });
	} else {
		console.log("Device already has stream, lets override the device stream id.");
		_deviceStreams = _deviceStreams.map((ds) => {
			if (ds.deviceHwid === deviceHwid) {
				ds.streamId = streamId;
			}
			return ds;
		});
	}
}

export function removeFromDeviceStreamList(deviceHwid: string): void {
	_deviceStreams = _deviceStreams.filter((ds) => ds.deviceHwid !== deviceHwid);
	_deviceLocks[deviceHwid] = false;
}
