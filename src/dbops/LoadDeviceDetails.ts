import { getConnection } from "../database/Connection";
import { Device } from "../types/Device";
let dbConnection = getConnection();
export function LoadDeviceDetails(hwid: string): Promise<{ success: boolean; device: Device }> {
	return new Promise((resolve, reject) => {
		// TODO: Implement get Owned deviecs for sub accounts
		dbConnection
			.promise()
			.execute(`SELECT * FROM Devices WHERE DeviceHWID = ?`, [hwid])
			.then(([rows]) => {
				if (Array.isArray(rows)) {
					if (rows.length === 1) {
						resolve({
							success: true,
							device: rows[0] as Device,
						});
					} else {
                        console.log("[LoadDeviceDetails] No device found with hwid: ", hwid)
                        resolve({
							success: false,
                            device: undefined
						});
                    }
                    
				} else {
                    console.log("[LoadDeviceDetails] We did not get an array from the database, for some reason.");
                    resolve({
                        success: false,
                        device: undefined
                    });
                }
			})
			.catch((e) => {
				console.error("error at database: ", e);
				reject({
					success: false,
                    err: e
				});
			});
	});
}
