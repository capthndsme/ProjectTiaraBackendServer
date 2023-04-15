const CheckSessionWithID = require("../dbops/CheckSessionWithID");
const CheckIfAccountHasDeviceAccess = require("../dbops/CheckIfAccountHasDeviceAccess");
const CreateSessionHash = require("../shared/CreateSessionHash");
let dbInstance, deviceManager, eventBus, webSocketHost;
module.exports = function (app, dbi, wsh, devMgr, evBus) {
    dbInstance = dbi;
    deviceManager = devMgr;
    evBus = evBus;
    webSocketHost = wsh
    app.get("/camera/streamRequest/:hwid", cameraStreamingConnection)
}

function cameraStreamingConnection(req, res) {
    const username = req.get("X-app-username")
    const session = req.get("Authorization")
    if (username && session) {
        CheckSessionWithID(username, session, dbInstance)
            .then((SessionValid) => {
                if (SessionValid.success) {
                    CheckIfAccountHasDeviceAccess(SessionValid.accountId, req.params.hwid, dbInstance)
                        .then((data) => {
                            if (data.success) {
                                deviceManager.createOrFindDeviceStream(req.params.hwid)
                                    .then(cameraStream => {
                                        if (cameraStream) {
                                            webSocketHost.sendMessageToHardwareAndWaitAcknowledgeWithPromise(req.params.hwid, "CameraStreamRequest", cameraStream)
                                                .then((success) => {
                                                    res.send({
                                                        "status": "success",
                                                        "streamID": cameraStream
                                                    })
                                                })
                                                .catch(e => {
                                                    res.send({
                                                        "status": "error",
                                                        "error": "DEVICE_NOSYNC"
                                                    })
                                                });
                                        } else {
                                            res.send({
                                                "status": "error",
                                                "error": "DEVICE_NOSYNC"
                                            })
                                        }
                                    });

                            } else {
                                res.status(403).send({
                                    "status": "error",
                                    "error": "device Session not valid"
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
