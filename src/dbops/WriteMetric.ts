module.exports = function (timestamp, metricType, metricvalue, deviceId, dbConnection) {
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