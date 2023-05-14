import { getConnection } from "../database/Connection";
const dbConnection = getConnection();

export function GetImagery(hwid: string) {
	return new Promise((resolve) => {
		dbConnection
			.promise()
			.execute("SELECT id, timestamp, fileHash, cdn FROM PT_Image_Snapshots WHERE hwid = ? ORDER BY timestamp DESC", [ hwid])
			.then(([rows, cols]) => {
				resolve(rows);
			});
	});
}
