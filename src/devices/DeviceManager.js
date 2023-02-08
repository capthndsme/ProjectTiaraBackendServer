class DeviceManager {
    _devices = [];
    constructor() {
        console.log("[Debug] Started Devices Manager")
    }

    insertDevice(hwid) {
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
            lastDispense: 0,
            schedules: {}
        })
    }
    findDeviceByHwid(hwid) {
        return this._devices.find(function(obj) {
            return obj.hwid === hwid;
        });
    }
    
}
module.exports = DeviceManager