import { getConnection } from "../database/Connection";
import { CheckIfAccountHasDeviceAccess } from "./CheckIfAccountHasDeviceAccess";
import { CheckIfUsernameHasDeviceAccess } from "./CheckIfUsernameHasDeviceAccess";
import { GetInviteDetails } from "./GetInviteDetails";
const dbConnection = getConnection();
export function AcceptInvite(inviteCode: string, acceptorUsername: string): Promise<{ success: boolean; message?: string }> {
	return new Promise((resolve, reject) => {
		GetInviteDetails(inviteCode)
			.then((inviteDetails) => {
				// Check if the invite exists
				const deviceQuery = `SELECT DeviceHWID FROM DevicesSubAccessInvites WHERE InviteToken = ?`;
				dbConnection
					.promise()
					.query(deviceQuery, [inviteCode])
					.then(([rows, fields]) => {
						if (Array.isArray(rows) && rows.length !== 0) {
                    
							// Invite exists.
							//@ts-ignore :(
							const deviceHWID = rows[0].DeviceHWID;
							// Check if the acceptor has access to the device.
							// This should protect from double-joining, and prevents
							// the owner from joining their own device (A very undefined behaviour)
							CheckIfUsernameHasDeviceAccess(acceptorUsername, deviceHWID)
                        .then((hasAccess) => {
                           console.log("Check access", hasAccess)
                    
                           if (hasAccess.success) {
                              resolve({ success: false, message: "You already have access to this device." });
                           } else {
                              // No access, let's insert the user into the database.
                              const insertQuery = `INSERT INTO DevicesSubAccess (AccountAccessee, DeviceHWID) VALUES ((SELECT AccountID FROM Accounts WHERE Username = ?), ?)`;
                              dbConnection
                                 .promise()
                                 .query(insertQuery, [acceptorUsername, deviceHWID])
                                 .then(([rows, fields]) => {
                                    resolve({
                                       success: true,
                                    });
                                 });
                           }
                        })
                        .catch((err) => {
                           console.log(err);
                           resolve({ success: false, message: "Backend error checking username access: " + err });
                        });
						} else {
							resolve({ success: false, message: "Invite does not exist." });
						}
					})
					.catch((err) => {
						console.log(err);
						resolve({ success: false, message: "Backend error getting hwid info: " + err });
					});
			})
			.catch((err) => {
				console.log(err);
				resolve({ success: false, message: "Can't get invite details: " + err });
			});
	});
}
