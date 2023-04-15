module.exports = function (AccountID, DeviceHWID, dbConnection) {
    return new Promise((resolve) => {
        dbConnection.promise().execute("SELECT * FROM Devices WHERE AccountOwnerID = ? AND DeviceHWID = ? ",
            [AccountID, DeviceHWID])
            .then(([rows, fields]) => {
                if (rows.length === 0) {
                    dbConnection.promise().execute("SELECT * FROM DevicesSubAccess WHERE AccountAccessee = ? AND DeviceHWID = ? ",
                        [AccountID, DeviceHWID])
                        .then(([rowsSA, fieldsSA]) => {
                            if (rowsSA.length === 0) {
                                resolve({
                                    success: false
                                })
                            } else {
                                resolve({
                                    success: true,
                                    type: "subAccess"
                                });
                            }
                        })
                        .catch((e) => {
                            resolve({
                                success: false
                            });
                            console.error(e);
                        })
                } else {
                    resolve({
                        success: true,
                        type: "owner"
                    });
                }
            }).catch((e) => {
                resolve({
                    success: false
                });
                console.error(e);
            })
    });
}