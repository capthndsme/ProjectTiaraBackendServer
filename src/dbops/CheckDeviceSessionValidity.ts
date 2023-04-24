import { getConnection } from "../database/Connection";
const dbConnection = getConnection();
export function CheckDeviceSessionValidity (DeviceHWID: string, DeviceToken: string, noReject = false): Promise<{ success: boolean, deviceId?: number }> {
	return new Promise((resolve, reject) => {
		if (DeviceHWID && DeviceToken) {
			dbConnection
				.promise()
				.execute("SELECT * FROM Devices WHERE DeviceHWID = ? AND DeviceToken = ? ", [DeviceHWID, DeviceToken])
				.then(([rows]) => {
					if (Array.isArray(rows)) {
						if (rows.length === 0) {
							// No rows = no sessions
							resolve({
								success: false,
							});
						} else {
							// Has rows = session exists
							resolve({
								success: true,
								deviceId: rows[0]["DeviceID"],
							});
						}
					} else {
						resolve({ success: false });
					}
				})
				.catch((e) => {
					if (!noReject) {
						reject({
							success: false,
						});
					}
				});
		} else {
			resolve({ success: false });
		}
	});
}
