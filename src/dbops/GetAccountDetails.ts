import { getConnection } from "../database/Connection";
import { AccountDetails } from "../types/Account";
const dbConnection = getConnection();
export function GetAccountDetails(accountId: number): Promise<AccountDetails> {
   return new Promise((resolve, reject)=> {
      dbConnection.query(`SELECT AccountID, Email, Username, DisplayName, DisplayImage FROM Accounts WHERE AccountID = ?`, [accountId], (err, result) => {
         if (err) {
            reject(err);
         } else {
            resolve(result[0] as AccountDetails);
         }
      });
   })
}
export function GetAccountDetailsUsername(account: string): Promise<AccountDetails> {
   return new Promise((resolve, reject)=> {
      dbConnection.query(`SELECT AccountID, Email, Username, DisplayName, DisplayImage FROM Accounts WHERE Username = ?`, [account], (err, result) => {
         if (err) {
            reject(err);
         } else {
            resolve(result[0] as AccountDetails);
         }
      });
   })
}