import { getConnection } from "../database/Connection";
const dbConnection = getConnection();

export function ClearNotifications(hwid: string, id?: number) {
	return new Promise((resolve) => {
		dbConnection
			.promise()
			.execute(`DELETE FROM PT_Notification_Table WHERE hwid = ? ${(typeof id==="number")?"AND id = ?":""}`, 
         (typeof id==="number")?[hwid, id]:[hwid])
			.then(() => {
				resolve(true);
			});
	});
}
