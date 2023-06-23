import { getConnection } from "../database/Connection";
import { CreateSessionHash } from "../shared/CreateSessionHash";
const dbConnection = getConnection();

const sqlStatement = `SELECT InviteToken FROM DevicesSubAccessInvites 
   WHERE DeviceHWID = ?
   AND OwnerID = (SELECT AccountOwnerID FROM Devices WHERE DeviceHWID = ?)`;
const createHashStatement = `INSERT INTO DevicesSubAccessInvites (InviteToken, DeviceHWID, OwnerID) VALUES (?, ?, (SELECT AccountOwnerID FROM Devices WHERE DeviceHWID = ?))`;
// This is a SUDO query, it should only be used by the owner of the device.
export function GetOrCreateInviteHash(DeviceHWID: string, Username: string): Promise<string> {
	return new Promise((resolve, reject) => {
		dbConnection
			.promise()
			.execute("SELECT * FROM Devices WHERE AccountOwnerID = (SELECT AccountID FROM Accounts WHERE Username = ?) AND DeviceHWID = ? ", [
				Username,
				DeviceHWID,
			])
			.then(([rows, fields]) => {
				if (Array.isArray(rows)) {
					if (rows.length === 0) {
						// It is not the owner of the device, reject the request.
						reject("Not the owner of the device.");
					} else {
                  dbConnection
                  .promise()
                  .execute(sqlStatement, [DeviceHWID, DeviceHWID])
                  .then(([rows, fields]) => {
                     if (Array.isArray(rows)) {
                        // Generate invite
                        if (rows.length === 0) {
                           CreateSessionHash(16).then((InviteToken) => {
                              dbConnection
                              .promise()
                              .execute(createHashStatement, [InviteToken, DeviceHWID, DeviceHWID])
                              .then(([rows, fields]) => {
                                 resolve(InviteToken)
                              });
                           });
                        } else {
                           // @ts-ignore I do not know why this is not working.
                           resolve( rows[0].InviteToken as string)
                        }
                     }
                  });
               }
				}
			});
	});
}



export function InvalidateHash(DeviceHWID: string, Username: string) {
   return new Promise((resolve, reject) => {
      dbConnection
         .promise()
         .execute("SELECT * FROM Devices WHERE AccountOwnerID = (SELECT AccountID FROM Accounts WHERE Username = ?) AND DeviceHWID = ? ", [
            Username,
            DeviceHWID,
         ])
         .then(([rows, fields]) => {
            if (Array.isArray(rows)) {
               if (rows.length === 0) {
                  // It is not the owner of the device, reject the request.
                  reject("Not the owner of the device.");
               } else {
                  dbConnection
                  .promise()
                  .execute("DELETE FROM DevicesSubAccessInvites WHERE DeviceHWID = ?", [DeviceHWID])
                  .then(([rows, fields]) => {
                     resolve(true)
                  });
               }
            }
         });
   });
}