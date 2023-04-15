import { getConnection } from "../database/Connection";
let dbConnection = getConnection();

export function WriteMetric (timestamp: number, metricType: string, metricvalue: string | number, deviceId: number) {
    return new Promise((resolve, reject) => {
        dbConnection.promise().execute(
            "INSERT INTO DeviceMetrics(Timestamp, MetricType, DeviceID, MetricValue) Values (?, ?, ?, ?)",
            [
                timestamp,
                metricType,
                deviceId,
                metricvalue
            ]
        )
        .then((result) => {
            resolve(result);
        })
        .catch((e) => reject(e));
    });
}