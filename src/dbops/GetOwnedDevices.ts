module.exports = function (AccountOwnerID, dbConnection, noReject = false) {
    return new Promise((resolve, reject) => {
        dbConnection.promise().execute("SELECT DeviceID, DeviceHWID, DeviceName, DeviceDescription FROM Devices WHERE AccountOwnerID = ?", [AccountOwnerID])
            .then(([rows, fields]) => {
                resolve({
                    success: true,
                    devices: rows
                });
            })
            .catch((e) => {
                if (!noReject) {
                    console.error("error at database: ", e);
                    reject({
                        success: false,
                        devices: []
                    });
                }

            })
    });
}