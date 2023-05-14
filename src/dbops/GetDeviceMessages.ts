import { getConnection } from "../database/Connection";
const dbConnection = getConnection();

export function GetDeviceMessages(hwid: string, limit: number = 250, before?: number, after?: number): Promise<Message[]> {
   let query = `SELECT PT_Messaging.*, Accounts.Username, Accounts.DisplayImage
   FROM PT_Messaging
   JOIN Accounts ON PT_Messaging.sender = Accounts.AccountID
   WHERE PT_Messaging.DeviceHWID = ?`;

   const params: Array<string|number> = [hwid];

   if (before !== undefined) {
      query += ` AND PT_Messaging.timestamp < ?`;
      params.push(before);
   } else if (after !== undefined) {
      query += ` AND PT_Messaging.timestamp > ?`;
      params.push(after);
   }

   query += ` ORDER BY PT_Messaging.timestamp ASC`;

   if (before !== undefined) {
      query += ` LIMIT ?`;
      params.push(limit);
   } else if (after !== undefined) {
      query += ` LIMIT ?, ?`;
      params.push(0, limit);
   } else {
      query += ` LIMIT ?`;
      params.push(limit);
   }

   return new Promise((resolve, reject) => {
      dbConnection.query(query, params, (err, result) => {
         if (err) {
            reject(err);
         } else {
            resolve(result as Message[]);
         }
      });
   });
}