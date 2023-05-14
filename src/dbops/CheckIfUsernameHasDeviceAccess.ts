import { getConnection } from "../database/Connection";
const dbConnection = getConnection();

/**
 * Compared to CheckIfAccountHasDeviceAccess, this function checks if a username has access to a device
 * This also THROWS AN ERROR when there is a database-layer error.
 */
export function CheckIfUsernameHasDeviceAccess(Username: string, DeviceHWID: string): Promise<{ success: boolean, type?: string}> {
	return new Promise((resolve) => {
		dbConnection
			.promise()
			.execute("SELECT * FROM Devices WHERE AccountOwnerID = (SELECT Username FROM Accounts WHERE Username = ? ) AND DeviceHWID = ? ", [Username, DeviceHWID])
			.then(([rows, fields]) => {
				if (Array.isArray(rows)) {
					if (rows.length === 0) {
						dbConnection
							.promise()
							.execute("SELECT * FROM DevicesSubAccess WHERE AccountAccessee = (SELECT Username FROM Accounts WHERE Username = ? ) AND DeviceHWID = ? ", [Username, DeviceHWID])
							.then(([rowsSA, fieldsSA]) => {
								if (Array.isArray(rowsSA)) {
									if (rowsSA.length === 0) {
										resolve({
											success: false,
										});
									} else {
										resolve({
											success: true,
											type: "subAccess",
										});
									}
								}
							})
						
					} else {
						resolve({
							success: true,
							type: "owner",
						});
					}
				} else {
					resolve({
						success: false,
					});
				}
			})
		
	});
}
