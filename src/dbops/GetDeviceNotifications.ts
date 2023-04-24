import { getConnection } from "../database/Connection";
const dbConnection = getConnection();
export function GetDeviceNotifications(DeviceID: string) {
	return new Promise((resolve) => {
		if (DeviceID) {
			dbConnection
				.promise()
				.query("SELECT * FROM PT_Notification_Table WHERE hwid = ?", [DeviceID])
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
