import { getConnection } from "../database/Connection";
import { Device } from "../types/Device";
let dbConnection = getConnection();
export function GetOwnedDevices(AccountOwnerID: number, noReject: boolean = false): Promise<{ success: boolean, devices: Device[] }> {
    return new Promise((resolve, reject) => {
        dbConnection.promise().execute("SELECT DeviceID, DeviceHWID, DeviceName, DeviceDescription FROM Devices WHERE AccountOwnerID = ?", [AccountOwnerID])
            .then(([rows, fields]) => {
                resolve({
                    success: true,
                    devices: rows as Device[]
                });
            })
            .catch((e) => {

                    console.error("error at database: ", e);
                    reject({
                        success: false,
                        devices: []
                    });


            })
    });
}