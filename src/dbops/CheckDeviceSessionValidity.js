module.exports = function (DeviceHWID, DeviceToken, dbConnection, noReject = false) {

    return new Promise((resolve, reject) => {
        if (DeviceHWID && DeviceToken) {
            dbConnection.promise().execute("SELECT * FROM Devices WHERE DeviceHWID = ? AND DeviceToken = ? ", [DeviceHWID, DeviceToken])
                .then(([rows, fields]) => {
                    if (rows.length === 0) {
                        // No rows = no sessions
                        resolve({
                            success: false
                        });
                    } else {
                        // Has rows = sessin exists
                        resolve({
                            success: true,
                            deviceId: rows[0].DeviceID
                        });
                    }
                })
                .catch((e) => {
                    if (!noReject) {
                        reject({
                            success: false
                        });
                    }

                })
        } else {
            resolve({ success: false })
        }

    });
}