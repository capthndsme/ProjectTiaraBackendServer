const { Server } = require("socket.io");
const CheckDeviceSessionValidity = require("../dbops/CheckDeviceSessionValidity");
const CreateSessionHash = require("../shared/CreateSessionHash");
let _io;
let _devices = [];

fns = {
    sendMessageToHardwareAndWaitAcknowledgeWithPromise: sendMessageToHardwareAndWaitAcknowledgeWithPromise,
    sendMessageToHardware: sendMessageToHardware
}
 

function sendMessageToHardwareAndWaitAcknowledgeWithPromise(hwid, eventType, dataSend) {
    return new Promise((resolve) => {
        let dev = _devices[hwid]
        if (dev) {
            CreateSessionHash(12).then((generatedEvHash) => {
                const emitData = { data: dataSend, evHash: generatedEvHash }
                console.log("[WebSocketHost] Emitted acknowledge-required event", eventType, emitData);
                dev.emit(eventType, emitData);
                let cancelTimeout = setTimeout(() => {
                    removeWaitCallback(generatedEvHash);
                    resolve(false);
                    console.warn("WAITING FOR ACKNOWLEDGE TIMED-OUT")
                }, 30000)
                createWaitCallback(() => {
                    resolve(true);
                    clearTimeout(cancelTimeout);
                    removeWaitCallback(generatedEvHash)
                }, generatedEvHash);

            })
        } else {
            resolve(false)
        }
    })
}

function sendMessageToHardware(hwid, eventType, dataSend) {
    return new Promise((resolve) => {
        let dev = _devices[hwid]
        if (dev) {
            CreateSessionHash(12).then((generatedEvHash) => {
                const emitData = { data: dataSend, evHash: generatedEvHash }
                console.log("[WebSocketHost] Emitted acknowledge-less event", eventType, emitData);
                dev.emit(eventType, emitData);
                resolve(true);

            })
        } else {
            resolve(false)
        }
    })
}

let _waitCallbacks = [];
function createWaitCallback(fn, evID) {
    let funct = _waitCallbacks.push({
        functionCall: fn,
        evID: evID
    })
}



function findWaitCallback(evID) {
    return _waitCallbacks.find(function (obj) {
        return obj.evID === evID;
    });
}
function removeWaitCallback(evID) {
    delete findWaitCallback(evID);

}
function findAndExecuteWaitCallback(evID) {
    let cb = findWaitCallback(evID);
    if (cb) {
        cb.functionCall();

    } else {
        console.log("Callback ID %s not found", evID)
    }
}
module.exports = function (server, database, deviceManager) {
    _io = new Server(server);
    console.log("[Debug] WebSocket Server initialised")
    _io.on("connect", (socket) => {
        console.log("[Debug] Socket connected, start verification.");
        CheckDeviceSessionValidity(
            socket.handshake.query.deviceHwid,
            socket.handshake.query.deviceToken,
            database
        ).then((res) => {
            if (res.success) {
                console.log("[Debug] Socket authenticated successfully.")
                _devices[socket.handshake.query.deviceHwid] = socket;
                socket.on("AcknowledgeActionID", (data) => {
                    if (data?.evID) {
                        findAndExecuteWaitCallback(data.evID)
                    }
                });
                socket.emit("HELLO", {ts:Date.now()});
            } else {
                console.log("[Debug] WebSocketHost Authentication failed.")
                socket.disconnect({ success: false, error: "AUTH_FAIL" });
            }
        }).catch(e => {
            console.error("WebSocketHost DB failed.", e)
            socket.disconnect({ success: false, error: "DB_FAIL" });
        })


    })
    return fns;
}

