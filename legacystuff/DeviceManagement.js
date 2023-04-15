const CheckDeviceSessionValidity = require("../dbops/CheckDeviceSessionValidity")
const CheckIfAccountHasDeviceAccess = require("../dbops/CheckIfAccountHasDeviceAccess")
const CheckPassword = require("../dbops/CheckPassword")
const CheckSessionWithID = require("../dbops/CheckSessionWithID")
const CreateDevice = require("../dbops/CreateDevice")
const GetOwnedDevices = require("../dbops/GetOwnedDevices")
const WriteMetric = require("../dbops/WriteMetric")

let dbInstance
let deviceManager
let webSockets
module.exports = function (app, dbi, wsh, devMgr) {
    dbInstance = dbi
    deviceManager = devMgr
    webSockets = wsh;
    
    // GET
    app.get("/devices/getDevices", getDevices)
    app.get("/devices/getDeviceState/:hwid", getDeviceState)





    // POST
    app.post("/devices/heartbeat", deviceHeartbeat)
    app.post("/devices/writeMetrics", deviceMetricsWrite)
    app.post("/devices/registerDevice", registerDevice)
    app.post("/devices/toggleState/:hwid", toggleDevice)
}


 
function toggleDevice(req, res) {
    let json = req.body
    if (json &&
        json.username &&
        json.session &&
        json.toggleName
    ) {
        CheckSessionWithID(json.username, json.session, dbInstance)
            .then(data => {
                if (data.success) {

                    let dev = deviceManager.findDeviceByHwid(req.params.hwid);
                    if (dev) {
                        webSockets.sendMessageToHardwareAndWaitAcknowledgeWithPromise(
                            req.params.hwid, "TOGGLEBUTTON", {
                                toggleName: json.toggleName,
                                toggleValue: json.toggleValue
                            },
                        ).then(HardwareAcknowledged=> {
                            if (HardwareAcknowledged) {
                                dev.toggles[json.toggleName] = json.toggleValue 
                                res.send({
                                    status: "success"
                                })
                            } else {
                                res.send({
                                    status: "error",
                                    error: "DEVICE_NO_RESPONSE"
                                })
                            }
                        })
                    } else {
                        res.send({
                            status: "error",
                            error: "DEVICE_OFFLINE"
                        })
                    }
                } else {
                    res.status(403).send({
                        "status": "error",
                        "error": "Token Invalid"
                    })
                }
            })
            .catch(e => {
                console.error(e);
                res.status(500).send({
                    "status": "error",
                    "error": "Database layer error"
                })
            })
    } else {
        res.status(403).send({
            "status": "error",
            "error": "Missing parameters."
        })
    }
}


function deviceMetricsWrite(req, res) {
    const json = req.body;
    if (json &&
        json.deviceToken &&
        json.deviceHwid &&
        json.metricType &&
        json.metricValue
    ) {
        let metricTimestamp = json.metricTimestamp ? json.metricTimestamp : Date.now();
        CheckDeviceSessionValidity(json.deviceHwid, json.deviceToken, dbInstance)
            .then((SessionValid) => {
                if (SessionValid.success) {
                    WriteMetric(metricTimestamp, json.metricType, json.metricValue, SessionValid.deviceId, dbInstance)
                        .then((WriteMetricState) => {
                            if (WriteMetricState) {
                                res.send({
                                    "status": "success"
                                })
                            } else {
                                res.status(500).send({
                                    "status": "error",
                                    "error": "Writing metric failed"
                                })
                            }
                        }).catch((e) => {
                            res.status(500).send({
                                "status": "error",
                                "error": "Database layer error"
                            })
                        })
                } else {
                    res.status(403).send({
                        "status": "error",
                        "error": "Device Token Invalid"
                    })
                }
            });
    } else {
        res.status(403).send({
            "status": "error",
            "error": "Wrong parameters."
        })
    }
}

function getDeviceState(req, res) {
    const username = req.get("X-app-username")
    const session = req.get("Authorization")
    if (username && session) {
        CheckSessionWithID(username, session, dbInstance)
            .then((SessionValid) => {
                if (SessionValid.success) {
                    CheckIfAccountHasDeviceAccess(SessionValid.accountId, req.params.hwid, dbInstance)
                        .then((data) => {
                            if (data.success) {
                                res.send({
                                    "status": "success",
                                    device: deviceManager.findDeviceByHwid(req.params.hwid),
                                    "type": data.type
                                })
                             
                            } else {
                                res.status(403).send({
                                    "status": "error",
                                    "error": "Session not valid"
                                })
                            }
                        })
                } else {
                    res.status(403).send({
                        "status": "error",
                        "error": "Session not valid"
                    })
                }
            })
            .catch((e) => {
                res.status(500).send({
                    "status": "error",
                    "error": "Database layer error"
                })
            })
    } else {
        res.status(403).send({
            "status": "error",
            "error": "Session not valid"
        })
    }
}
function deviceHeartbeat(req, res) {
    let json = req.body;
    if (json &&
        json.deviceToken &&
        json.deviceHwid
    ) {
        CheckDeviceSessionValidity(json.deviceHwid, json.deviceToken, dbInstance)
            .then((state) => {
                if (state.success) {
                    let localDevice = deviceManager.findDeviceByHwid(json.deviceHwid)
                    if (localDevice) {
                        // Device is in array. Just update last heartbeat... For now?
                        if (json.sensors) {
                            localDevice.sensors.temperature = json.sensors.tempSensor
                        }
                        if (json.schedules) {
                            localDevice.schedules = json.schedules;
                        }
                        localDevice.lastHeartbeatTimestamp = Date.now()
                        res.send({
                            "status": "success"
                        })
                    } else {
                        deviceManager.insertDevice(json.deviceHwid);
                        res.send({
                            "status": "success"
                        })
                    }
                } else {
                    res.status(403).send({
                        "status": "error",
                        "error": "Invalid device ID/Session. Re-perform setup."
                    })
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send({ status: "error", error: "Ewan ko ba" })
            })
    } else {
        res.status(403).send({
            "status": "error",
            "error": "Missing parameters."
        })
    }
}
function registerDevice(req, res) {
    let json = req.body
    if (json &&
        json.username &&
        json.password &&
        json.deviceHwid &&
        json.deviceName &&
        json.deviceDescription
    ) {
        CheckPassword(json.username, json.password, dbInstance).then((result) => {
            if (result.status) {
                CreateDevice(
                    result.accountId,
                    json.deviceHwid,
                    json.deviceName,
                    json.deviceDescription,
                    dbInstance
                ).then((deviceState) => {
                    res.send({
                        status: "success",
                        deviceId: deviceState.deviceId,
                        deviceToken: deviceState.hash
                    })
                }).catch((e) => {
                    res.status(500).send({ status: "error", error: "Database Layer Error" })
                });
            } else {
                res.status(403).send({
                    "status": "error",
                    "error": "Wrong password."
                })
            }
        }).catch((e) => {
            res.status(500).send({ status: "error", error: "Database Layer Error" })
        });
    } else {
        res.status(403).send({
            "status": "error",
            "error": "Missing parameters."
        })
    }
}


function getDevices(req, res) {
    const username = req.get("X-app-username")
    const session = req.get("Authorization")
    if (username && session) {
        CheckSessionWithID(username, session, dbInstance)
            .then((SessionValid) => {
                if (SessionValid.success) {
                    GetOwnedDevices(SessionValid.accountId, dbInstance).then((Devices) => {
                        if (Devices.success) {
                            res.send({
                                "status": "success",
                                "devices": Devices.devices
                            })
                        } else {
                            res.status(500).send({
                                "status": "error",
                                "error": "server error"
                            })
                        }
                    }).catch((e) => {
                        console.error(e);
                    })
                } else {
                    res.status(403).send({
                        "status": "error",
                        "error": "Session not valid"
                    })
                }
            })
            .catch((e) => {
                res.status(500).send({
                    "status": "error",
                    "error": "Database layer error"
                })
            })
    } else {
        res.status(403).send({
            "status": "error",
            "error": "Session not valid"
        })
    }
}