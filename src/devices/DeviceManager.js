const CreateSessionHash = require("../shared/CreateSessionHash");

class DeviceManager {
    _devices = [];
    _devicesInternalStructures = [];
    _deviceStreams = [];
    _eventBus;
    constructor(eventBus) {
        this._eventBus = eventBus;
        console.log("[Debug] Started Devices Manager")
    }
    
    insertDevice(hwid) {
        this._devicesInternalStructures[hwid] = {};
        this._devices.push({
            hwid: hwid,
            lastHeartbeatTimestamp: Date.now(),
            sensors: {
               temperature: {} 
            },
            toggles: {
                foodDispensing: false,
                padCleaning: false,
                windowsOpen: false,
                doorLockOpen: false,
                ventOpen: false
            },
            cameraStreamID: null,
            lastDispense: 0,
            schedules: {}
        })
    }
    createOrFindDeviceStream(hwid) {
        return new Promise((resolve, reject) => {
            const device = this.findDeviceByHwid(hwid);
            if (!device) {
                resolve(false);
                return;
            }
       
            if (device.cameraStreamID) {
                console.log("[DeviceManager Streams] Reusing cached camera stream session")
                clearTimeout(this._devicesInternalStructures[hwid].cameraStreamTimeout);
                this._devicesInternalStructures[hwid].cameraStreamTimeout = setTimeout(() => {
                    this._devicesInternalStructures[hwid].cameraStreamID = null;
                    console.log("Stream keepalive timed-out, sending disconnect.");
                    this._eventBus.emit("StreamingDisconnect", null, hwid)
                }, 60000);
                resolve(device.cameraStreamID);

                 
            } else {
                console.log("[DeviceManager Streams] Creating new camera stream session")
                CreateSessionHash(16).then(evHash=> {
                    device.cameraStreamID = evHash;
                    clearTimeout(this._devicesInternalStructures[hwid].cameraStreamTimeout);
                    this._devicesInternalStructures[hwid].cameraStreamTimeout = setTimeout(() => {
                        device.cameraStreamID = null;
                        console.log("Stream keepalive timed-out, sending disconnect.")
                        this._eventBus.emit("StreamingDisconnect", null, hwid)
                    }, 60000);
                    resolve(evHash);
                })
                
            }
            
        })
        
    }
    findDeviceByHwid(hwid) {
        return this._devices.find(function(obj) {
            return obj.hwid === hwid;
        });
    }
    
}
module.exports = DeviceManager