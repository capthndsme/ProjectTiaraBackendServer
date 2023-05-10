import { getConnection } from "../database/Connection";
import { ImageSnapshots } from "../types/ImageSnapshots";
const dbConnection = getConnection();

export function InsertSnapshotsForDevice(snapshot: ImageSnapshots): Promise<boolean> {
	return new Promise((resolve, reject) => {
		dbConnection
			.promise()
			.execute("INSERT INTO `PT_Image_Snapshots` (hwid, timestamp, fileHash, cdn) VALUES (?, ?, ?, ?)", [snapshot.hwid, snapshot.timestamp, snapshot.fileHash, snapshot.cdn])
         .then(([rows, fields]) => {
            // Typecast to ImageSnapshots.
            resolve(true);
         })
         

	});
}
