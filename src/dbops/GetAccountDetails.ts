import { getConnection } from "../database/Connection";
const dbConnection = getConnection();
export function GetAccountDetails(accountId: number) {
   return new Promise((resolve, reject)=> {
      dbConnection.query(`SELECT AccountID, Email, Username, DisplayName, DisplayImage FROM Accounts WHERE AccountID = ?`, [accountId], (err, result) => {
         if (err) {
            reject(err);
         } else {
            resolve(result[0]);
         }
      });
   })
}