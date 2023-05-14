import mysql from "mysql2";
export function CreateTables(dbConnection: mysql.Pool) {
	const AccountsTable = `CREATE TABLE IF NOT EXISTS \`Accounts\` (
        \`AccountID\` INT NOT NULL AUTO_INCREMENT,
        \`Email\` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`Username\` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`Password\` BINARY(60) NOT NULL,
        \`DisplayName\` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`DisplayImage\` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        PRIMARY KEY (\`AccountID\`)
    );`;
	const SessionsTable = `CREATE TABLE IF NOT EXISTS \`Sessions\` (
        \`SessionID\` INT NOT NULL AUTO_INCREMENT,
        \`AccountID\` INT NOT NULL,
        \`LoginTime\` LONG NOT NULL,
        \`LastActive\` LONG NOT NULL,
        \`Username\` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`Session\` CHAR(64) NOT NULL,
        \`IPAddress\` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        PRIMARY KEY (\`SessionID\`),
        FOREIGN KEY (\`AccountID\`) REFERENCES Accounts(\`AccountID\`)
    );`;
    const DevicesTable = `CREATE TABLE IF NOT EXISTS \`Devices\` (
        \`DeviceID\` INT NOT NULL AUTO_INCREMENT,
        \`AccountOwnerID\` INT NOT NULL,
        \`DeviceHWID\` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`DeviceName\` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`DeviceDescription\` VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`DeviceToken\` CHAR(64) NOT NULL,
        PRIMARY KEY (\`DeviceID\`),
        FOREIGN KEY (\`AccountOwnerID\`) REFERENCES Accounts(\`AccountID\`),
        INDEX idx_devicehwid (\`DeviceHWID\`)
        );`;
	const DeviceSubAccessTable = `CREATE TABLE IF NOT EXISTS \`DevicesSubAccess\` (
        \`SubaccessID\` INT NOT NULL AUTO_INCREMENT,
        \`DeviceHWID\` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`AccountAccessee\` INT NOT NULL,
        PRIMARY KEY (\`SubaccessID\`),
        FOREIGN KEY (\`AccountAccessee\`) REFERENCES Accounts(\`AccountID\`)
    );`;
	const DeviceSubAccessInvitesTable = `CREATE TABLE IF NOT EXISTS \`DevicesSubAccessInvites\` (
        \`InviteID\` INT NOT NULL AUTO_INCREMENT,
        \`DeviceHWID\` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`OwnerID\` INT NOT NULL,
        \`InviteToken\` VARCHAR(64) NOT NULL,
        PRIMARY KEY (\`InviteID\`),
        FOREIGN KEY (\`OwnerID\`) REFERENCES Accounts(\`AccountID\`)
    );`;

	const MetricsTable = `CREATE TABLE IF NOT EXISTS \`DeviceMetrics\` (
        \`MetricID\` INT NOT NULL AUTO_INCREMENT,
        \`Timestamp\` DOUBLE NOT NULL,
        \`MetricType\` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`DeviceID\` INT NOT NULL,
        \`MetricValue\` VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL, 
        PRIMARY KEY (\`MetricID\`),
        FOREIGN KEY (\`DeviceID\`) REFERENCES Devices(\`DeviceID\`)
    );`;

	const PTNotifications = `CREATE TABLE IF NOT EXISTS \`PT_Notification_Table\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`hwid\` VARCHAR(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`sentTimestamp\` BIGINT NOT NULL,
        \`type\` VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
        \`title\` VARCHAR(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`message\` VARCHAR(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        PRIMARY KEY (\`id\`)
     );`;
	const PTWebPush = `CREATE TABLE IF NOT EXISTS \`PT_WebPush\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`hwid\` VARCHAR(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`notification_url\` VARCHAR(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        PRIMARY KEY (\`id\`)
     );`;

	// This table is used to store persistent data for devices
	// A simple key-value store would've been enough, but here we are using a table...
	const PTPersists = `CREATE TABLE IF NOT EXISTS \`PT_Persistent_Data\` (
        \`hwid\` VARCHAR(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`stateCache\` VARCHAR(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        PRIMARY KEY (\`hwid\`)
     );`;

	// A table that stores snapshots of device camera.
	const PTImageSnapshots = `CREATE TABLE IF NOT EXISTS \`PT_Image_Snapshots\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`hwid\` VARCHAR(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`timestamp\` BIGINT NOT NULL,
        \`fileHash\` VARCHAR(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`cdn\` VARCHAR(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        PRIMARY KEY (\`id\`)
    );`;

	// Device messaging table
	const PTMessaging = `CREATE TABLE IF NOT EXISTS \`PT_Messaging\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`timestamp\` BIGINT NOT NULL,
        \`DeviceHWID\` VARCHAR(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`sender\` INT NOT NULL,
        \`msgContent\` VARCHAR(4096) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`sender\`) REFERENCES Accounts(\`AccountID\`),
        FOREIGN KEY (\`DeviceHWID\`) REFERENCES Devices(\`DeviceHWID\`)
    )`;

	const before = performance.now();
	console.log("[Debug] Creating tables if doesn't exist...");
	dbConnection.query(AccountsTable);
	dbConnection.query(SessionsTable);
	dbConnection.query(DevicesTable);
	dbConnection.query(DeviceSubAccessTable);
	dbConnection.query(MetricsTable);
	dbConnection.query(PTNotifications);
	dbConnection.query(PTWebPush);
	dbConnection.query(PTPersists);
	dbConnection.query(DeviceSubAccessInvitesTable);
	dbConnection.query(PTImageSnapshots);
	dbConnection.query(PTMessaging);
	console.log("[Debug] Tables created, %sms", (performance.now() - before).toFixed(2));
}
