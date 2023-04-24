import { getConnection } from "../database/Connection";
const dbConnection = getConnection();
import {CreateSessionHash} from "../shared/CreateSessionHash"

export function CreateDevice (ownerId: number, deviceHwid: string, deviceName: string, deviceDescription: string): Promise<{hash: string, deviceId: number}> {
    return new Promise((resolve, reject) => {
        CreateSessionHash().then((hash) => {
            dbConnection.promise().execute(
                "INSERT INTO Devices (AccountOwnerID, DeviceHWID, DeviceName, DeviceDescription, DeviceToken) VALUES (?, ?, ?, ?, ?)",
                [ownerId, deviceHwid, deviceName, deviceDescription, hash]
            ).then((insert) => {
                resolve({
                    hash: hash, 
                    deviceId: insert[0]["insertId"]
                })
            }).catch((e) =>{
                reject(e);
                console.error("Database layer error ", e)
            })
        })
    });

}