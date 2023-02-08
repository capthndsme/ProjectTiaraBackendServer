const CreateSessionHash = require('../shared/CreateSessionHash')

module.exports = function (ownerId, deviceHwid, deviceName, deviceDescription, dbConnection) {
    return new Promise((resolve, reject) => {
        CreateSessionHash().then((hash) => {
            dbConnection.promise().execute(
                "INSERT INTO Devices (AccountOwnerID, DeviceHWID, DeviceName, DeviceDescription, DeviceToken) VALUES (?, ?, ?, ?, ?)",
                [ownerId, deviceHwid, deviceName, deviceDescription, hash]
            ).then((insert) => {
                resolve({
                    hash: hash, 
                    deviceId: insert[0].insertId
                })
            }).catch((e) =>{
                reject(e);
                console.error("Database layer error ", e)
            })
        })
    });

}