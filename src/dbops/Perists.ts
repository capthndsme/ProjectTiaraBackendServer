import { getConnection } from "../database/Connection";
import { DeviceState } from "../types/DeviceState";
const dbConnection = getConnection();

export function loadStateCache(DeviceHWID: string): Promise<DeviceState> {
	return new Promise((resolve, reject) => {
		dbConnection
			.promise()
			.query("SELECT stateCache FROM PT_Persistent_Data WHERE hwid = ?", [DeviceHWID])
			.then(([rows, fields]) => {
            try {
					resolve(JSON.parse(rows[0]["stateCache"]) as DeviceState);
				} catch(e) {
					console.log("LoadState failed (Invalid JSON?)", e);
					reject(e);
				}
				
			})
			.catch((e) => {
				console.log("LoadState failed", e);
				reject(e);
			});
	});
}

export function saveStateCache(DeviceHWID: string, stateCache: DeviceState) {
	return dbConnection
		.promise()
		.query("UPDATE PT_Persistent_Data SET stateCache = ? WHERE hwid = ?", [JSON.stringify(stateCache), DeviceHWID]);
}

export function createStateCache(DeviceHWID: string, stateCache: DeviceState) {
	console.log(stateCache);
	return dbConnection
		.promise()
		.query("INSERT INTO PT_Persistent_Data (stateCache, hwid) VALUES(?, ?)", [JSON.stringify(stateCache), DeviceHWID]);
}
