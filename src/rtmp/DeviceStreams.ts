import { findDeviceSocket } from "../ws/DeviceSocketList";

export type DeviceStream = {
	deviceHwid: string;
	streamId: string;
};

let _deviceStreams: DeviceStream[] = [];
let _deviceLocks: boolean[] = [];
export function findDeviceStream(deviceHwid: string): DeviceStream | undefined {
	return _deviceStreams.find((ds) => ds.deviceHwid === deviceHwid);
}

// This returns undefined when, either the device is offline or the device is online but the device did not send a stream request.
export function findOrRequestDeviceStream(deviceHwid: string): DeviceStream | undefined {
   console.log("findOrRequestDeviceStream")
  
   if (_deviceLocks[deviceHwid] === true) {
      console.log("Device is locked, returning undefined");
      return undefined;
   } // This is to prevent multiple requests from being sent to the device.
   _deviceLocks[deviceHwid] = true;
	let deviceStream = findDeviceStream(deviceHwid);
	if (deviceStream === undefined) {
		// Request stream from device.
		const generatedStreamKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

		findDeviceSocket(deviceHwid)
			?.socket.timeout(20000)
			.emit(
				"CameraStreamRequest",
				{
					streamKey: generatedStreamKey,
				},
				(error, data: any) => {
               if (error) {
                  _deviceLocks[deviceHwid] = false;
               }
					if (data && data.success) {
                  _deviceLocks[deviceHwid] = false;
						addToDeviceStreamList(deviceHwid, generatedStreamKey);
						deviceStream = findDeviceStream(deviceHwid);
					}
				}
			);
	} else {
      _deviceLocks[deviceHwid] = false;
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
