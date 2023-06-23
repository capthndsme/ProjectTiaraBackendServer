import { getConnection } from "../database/Connection";
const dbConnection = getConnection();

export function UpdateDevice(DeviceHWID: string, DeviceName: string, DeviceDescription: string) { 
   const sqlStatement = `UPDATE Devices SET DeviceName = ?, DeviceDescription = ? WHERE DeviceHWID = ?`;
   return new Promise((resolve, reject) => {
      dbConnection
         .promise()
         .execute(sqlStatement, [DeviceName, DeviceDescription, DeviceHWID])
         .then(([rows, fields]) => {
            resolve(rows);
         });
   });
}