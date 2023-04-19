export type DeviceStream = {
   deviceHwid: string;
   streamId: string;
}

let _deviceStreams: DeviceStream[] = [];

export function findDeviceStream(deviceHwid: string): DeviceStream | undefined {
   return _deviceStreams.find((ds) => ds.deviceHwid === deviceHwid);
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
}

