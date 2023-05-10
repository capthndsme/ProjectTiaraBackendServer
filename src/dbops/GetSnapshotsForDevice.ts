import { getConnection } from "../database/Connection";
import { ImageSnapshots } from "../types/ImageSnapshots";
const dbConnection = getConnection();

export function GetSnapshotsForDevice(DeviceHWID: string): Promise<Array<ImageSnapshots>> {
	return new Promise((resolve, reject) => {
		dbConnection
			.promise()
			.execute("SELECT * FROM `PT_Image_Snapshots` WHERE hwid = ?", [DeviceHWID])
         .then(([rows, fields]) => {
            // Typecast to ImageSnapshots.
            if (rows) resolve(rows as Array<ImageSnapshots>)
         })

	});
}
