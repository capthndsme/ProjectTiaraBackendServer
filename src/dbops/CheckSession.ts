import { getConnection } from "../database/Connection";
let dbConnection = getConnection();

export function CheckSession(Username: string, Session: string, noReject: boolean = false): Promise<boolean> {
	return new Promise((resolve, reject) => {
		dbConnection
			.promise()
			.execute("SELECT * FROM Sessions WHERE Username = ? AND Session = ? ", [Username, Session])
			.then(([rows, fields]) => {
				if (Array.isArray(rows)) {
					if (rows.length === 0) {
						// No rows = no sessions
						resolve(false);
					} else {
						// Has rows = sessin exists
						resolve(true);
					}
				} else {
					resolve(false);
				}
			})
			.catch((e) => {
				if (!noReject) {
					reject(e);
				}
			});
	});
}
