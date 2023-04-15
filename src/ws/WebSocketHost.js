const { Server } = require("socket.io");
const CheckDeviceSessionValidity = require("../dbops/CheckDeviceSessionValidity");
const CreateSessionHash = require("../shared/CreateSessionHash");
const CheckSessionWithID = require("../dbops/CheckSessionWithID");
const GetOwnedDevices = require("../dbops/GetOwnedDevices");
const CheckPassword = require("../dbops/CheckPassword");
const CreateSession = require("../dbops/CreateSession");
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
let clientSockets = [];
let deviceSockets = [];
module.exports = function (server, database, deviceManager) {
    _io = new Server(server, {
        cors: {
            origin: "*",
        },
    });
    const cio = _io.of("/client");
    const dio = _io.of("/device");
    console.log("[Debug] WebSocket Server initialised")
    _io.on("connection", (socket) => {
        console.warn("[WebSocketHost] Connection made to root namespace, disconnecting.")
        socket.disconnect();
    });
    dio.on("connect", (socket) => {
        console.log("[Debug] Device socket connected, start verification.");
        CheckDeviceSessionValidity(
            socket.handshake.query.deviceHwid,
            socket.handshake.query.deviceToken,
            database
        ).then((res) => {
            if (res.success) {
                console.log("[Debug] Device socket authenticated successfully.")
                _devices[socket.handshake.query.deviceHwid] = socket;
                socket.on("AcknowledgeActionID", (data) => {
                    if (data?.evID) {
                        findAndExecuteWaitCallback(data.evID)
                    }
                });
                socket.on("DeviceSyncToggleState", (data) => {

                })

                socket.on("PingKeepAlive", (data, callback) => {
                    // Timestamp delta is the difference between the client's timestamp and the server's timestamp.
                    // Not sure for at the moment, but it might be useful for debugging or for syncing the client's clock.
                    callback({ success: true, ts: Date.now(), timestampDelta: Date.now() - data.ts })
                });
                socket.emit("HELLO", { ts: Date.now() });
            } else {
                console.log("[Debug] WebSocketHost Authentication failed.")
                socket.disconnect({ success: false, error: "AUTH_FAIL" });
            }
        }).catch(e => {
            console.error("WebSocketHost DB failed.", e)
            socket.disconnect({ success: false, error: "DB_FAIL" });
        })


    })

    cio.on("connect", (socket) => {
        clientSockets.push(socket);
        function authDisconnect() {
            console.log("[Debug] Client socket authentication timed-out.")
            socket.disconnect({ success: false, error: "AUTH_TIMEOUT" });
        }
        let authTimeout = setTimeout(authDisconnect, 60000);
        console.log("[Debug] Client socket connected, start verification.");
        socket.on("authenticate", (data, callback) => {

            if (data.username && data.session) {
                CheckSessionWithID(data.username, data.session, database).then((res) => {
                    if (res) {
                        console.log("[Debug] Client socket authenticated successfully.")
                        // Join a username-specific room.
                        // When we receive a message from device, we will find its owners and send it to them.
                        socket.join(data.username);
                        callback({ success: true, accountId: res.accountId });
                        clearTimeout(authTimeout);
                        // Null the timeout so we don't accidentally disconnect the socket.
                        authTimeout = null;
                    } else {
                        console.log("[Debug] Client socket authentication failed.")
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
                console.log("AuthenticationKeepalive received, but the socket is already authenticated. Ignoring so we don't accidentally disconnect the socket.");
            }

        });

        socket.on("SubscribeToHardware", (data, callback) => {
            if (data.hwid) {
                console.log("[WebSocketHost] Subscribing to hardware", data.hwid);
                socket.data.subscribedHardware = data.hwid;
                callback({ success: true });
            }
        });
                
        socket.on("login", (data, callback) => {
            if (data.username && data.password) {
                CheckPassword(data.username, data.password, database).then((res) => {
                    if (res.status) {
                        console.log("[Debug] Client socket logged in successfully.")

                        CreateSession(res.accountId, data.username, socket.handshake.address, database).then((sessionHash) => {
                            callback({
                                success: true,
                                accountId: res.accountId,
                                session: sessionHash,

                            });
                            clearTimeout(authTimeout);
                            authTimeout = null;

                        });
                    } else {
                        console.log("[Debug] Client socket login failed.")
                        callback({
                            success: false
                        })
                    }
                })
            }
        });
        socket.on("requestDeviceList", (data, callback) => {
            GetOwnedDevices(data.accountId, database).then((res) => {
                console.log("[WebSocketHost] devices", res)
                callback(res);
            })
        });
        socket.on("disconnect", () => {
            console.log("[Debug] Client socket disconnected.")
            clearTimeout(authTimeout);
            clientSockets = clientSockets.filter((s) => s !== socket);
        });
    });
    return fns;
}

