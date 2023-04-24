import { getConnection } from "../database/Connection";
import { Device } from "../types/Device";
const dbConnection = getConnection();
export function GetOwnedDevices(AccountOwnerID: number, noReject = false): Promise<{ success: boolean, devices: Device[] }> {
    return new Promise((resolve, reject) => {
        // TODO: Implement get Owned deviecs for sub accounts
        dbConnection.promise().execute("SELECT Devices.DeviceID, Devices.DeviceHWID, Devices.DeviceName, Devices.DeviceDescription, CASE WHEN Devices.AccountOwnerID = ? THEN 'owner' WHEN DevicesSubAccess.AccountAccessee = ? THEN 'subAccess' ELSE NULL END AS AccessType FROM Devices LEFT JOIN DevicesSubAccess ON Devices.DeviceHWID = DevicesSubAccess.DeviceHWID WHERE Devices.AccountOwnerID = ? OR DevicesSubAccess.AccountAccessee = ?", [AccountOwnerID,AccountOwnerID,AccountOwnerID,AccountOwnerID])
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