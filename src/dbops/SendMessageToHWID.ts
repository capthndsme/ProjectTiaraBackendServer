import { getConnection } from "../database/Connection";
const dbConnection = getConnection();
export function SendMessageToHWID(hwid: string, username: string, message: string) {
	const query = `INSERT INTO PT_Messaging (timestamp, DeviceHWID, sender, msgContent) VALUES (?, ?, (SELECT AccountID FROM Accounts WHERE Username = ?), ?);`;
   return new Promise((resolve, reject) => {
      dbConnection.query(query, [Date.now(), hwid, username, message], (err, result) => {
         if (err) {
            reject(err);
         } else {
            resolve(result);
         }
      });
   });
}
