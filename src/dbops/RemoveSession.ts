import { getConnection } from "../database/Connection";
const dbConnection = getConnection();

export function RemoveSession(session: string, username: string) {
	return new Promise((resolve) => {
		dbConnection
			.promise()
			.execute("DELETE FROM Sessions WHERE Session = ? AND Username = ?", [session, username])
			.then(() => {
				resolve(true);
			});
	});
}
