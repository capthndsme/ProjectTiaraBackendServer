import { getConnection } from "../database/Connection";
const dbConnection = getConnection();
export function GetDeviceNotifications(DeviceID: string, limit: number = 100, offset: number = 0) {
	return new Promise((resolve) => {
		if (DeviceID) {
			const query = "SELECT * FROM PT_Notification_Table WHERE hwid = ? ORDER BY id DESC LIMIT ? OFFSET ?;"
			dbConnection
				.promise()
				.query(query, [DeviceID, limit, offset])
				.then(([rows, fields]) => {
					resolve(rows);
				})
				.catch((e) => {
					console.log(e);
				});
		} else {
         resolve([]);
      }
	});
}
