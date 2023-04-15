import { getConnection } from "../database/Connection";
let dbConnection = getConnection();

export function CheckIfAccountHasDeviceAccess(AccountID: string, DeviceHWID: string): Promise<{ success: boolean, type?: string}> {
	return new Promise((resolve) => {
		dbConnection
			.promise()
			.execute("SELECT * FROM Devices WHERE AccountOwnerID = ? AND DeviceHWID = ? ", [AccountID, DeviceHWID])
			.then(([rows, fields]) => {
				if (Array.isArray(rows)) {
					if (rows.length === 0) {
						dbConnection
							.promise()
							.execute("SELECT * FROM DevicesSubAccess WHERE AccountAccessee = ? AND DeviceHWID = ? ", [AccountID, DeviceHWID])
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
							.catch((e) => {
								resolve({
									success: false,
								});
								console.error(e);
							});
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
			.catch((e) => {
				resolve({
					success: false,
				});
				console.error(e);
			});
	});
}
