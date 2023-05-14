import { getConnection } from "../database/Connection";
const dbConnection = getConnection();

export function GetSessions(username: string) {
	return new Promise((resolve) => {
		dbConnection
			.promise()
			.execute("SELECT Username, IPAddress, Session, LoginTime, LastActive FROM Sessions WHERE Username = ?", [ username])
			.then(([rows, cols]) => {
				resolve(rows);
			});
	});
}
