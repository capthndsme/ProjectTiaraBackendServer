 
import { getConnection } from "../database/Connection";
const dbConnection = getConnection();

const query = `SELECT a.Username, a.AccountID, b.DeviceName, b.DeviceDescription, a.DisplayImage FROM Accounts a INNER JOIN Devices b ON a.AccountID = b.AccountOwnerID INNER JOIN DevicesSubAccessInvites c ON b.DeviceHWID = c.DeviceHWID WHERE c.InviteToken = ?`;

 
export type InviteDetails ={
   Username: string,
   AccountID: number,
   DeviceName: string,
   DeviceDescription: string, 
   DisplayImage: string  
}

export function GetInviteDetails(inviteCode: string, returnFalseIfRejected?: boolean): Promise<InviteDetails|false>{
	console.log("GetInviteDetails invoked", inviteCode)
   return new Promise((resolve, reject) => {
		dbConnection
			.promise()
			.execute(query, [inviteCode])
			.then(([rows, cols]) => {
				if (Array.isArray(rows)) {
               if (rows.length === 0) {
                  if (!returnFalseIfRejected) reject();
                  if (returnFalseIfRejected) resolve(false);
               } else {
                  resolve(rows[0] as InviteDetails);
               }
            }
			});
	});
}
