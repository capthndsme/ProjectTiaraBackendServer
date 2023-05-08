import { getConnection } from "../database/Connection";
import { Stats } from "../types/Stats";
const dbConnection = getConnection();
export function GetStats(
	DeviceID: string,
	limit: number = 100,
	offset: number = 0,
	getByPastDays?: number,
	getByParams?: {
		byDay?: boolean;
		byMonth?: boolean;
		byYear?: boolean;
	},
	getByTimestamp: number = Date.now()
): Promise<Array<Stats<any>>> {
	return new Promise((resolve, reject) => {
		if (DeviceID) {
			let query;
			const getByMode = getByParams && (getByParams.byDay || getByParams.byMonth || getByParams.byYear);
			if (getByPastDays && getByMode) {
				reject("Cannot use getByPastDays and use getByParams at the same time.");
			}
			let timestamps = [];
			let numTimestamps = 0;
			let localQuery = "";
			if (getByMode) {
				if (getByParams.byDay) {
					localQuery =
						"AND YEAR(FROM_UNIXTIME(Timestamp)) = YEAR(FROM_UNIXTIME(?)) AND MONTH(FROM_UNIXTIME(Timestamp)) = MONTH (FROM_UNIXTIME(?)) AND DAY(FROM_UNIXTIME(Timestamp)) = DAY(FROM_UNIXTIME(?)) ";
					numTimestamps = 3;
				}
				if (getByParams.byMonth) {
					localQuery =
						"AND YEAR(FROM_UNIXTIME(Timestamp)) = MONTH(FROM_UNIXTIME(?)) AND MONTH(FROM_UNIXTIME(Timestamp)) = MONTH(FROM_UNIXTIME(?)) ";
					numTimestamps = 2;
				}
				if (getByParams.byYear) {
					localQuery = "AND YEAR(FROM_UNIXTIME(Timestamp)) = MONTH(FROM_UNIXTIME(?)) ";
					numTimestamps = 1;
				}
				// This should be safe from injections, even though we are concatenating strings,
				// since we control our localQuery variable.
			}
			query =
				"SELECT * FROM DeviceMetrics WHERE DeviceID = (select DeviceID from Devices where DeviceHWID = ?) " +
				localQuery +
				"ORDER BY MetricID DESC LIMIT ? OFFSET ?";
			
			if (getByPastDays) {
				query =
					"SELECT * FROM DeviceMetrics WHERE DeviceID = (select DeviceID from Devices where DeviceHWID = ?) AND Timestamp > ? ORDER BY MetricID DESC LIMIT ? OFFSET ?";
				numTimestamps = 1;
			}
			
			// A hacky way to dynamically assign timestamps or anything to our prepared statement.
			for (let i = 0; i < numTimestamps; i++) {
				// Ultimate hack xd 
				// What do you expect, we're running out of time to finish this project.
				timestamps.push(getByMode?getByTimestamp:getByPastDays);
			}
			console.log("Final query: " + query);
			console.log("Final timestamps: " + timestamps);
			dbConnection
				.promise()
				.query(query, getByMode || getByPastDays ? [ DeviceID, ...timestamps, limit, offset] : [DeviceID, limit, offset])
				.then(([rows, fields]) => {
					// Since we're using a generic type, we need to cast the rows as an array of Stats<any>.
					resolve(rows as Array<Stats<any>>);
				})
				.catch((e) => {
					console.log(e);
				});
		} else {
			// an empty array of undefineds.
			resolve([]);
		}
	});
}
