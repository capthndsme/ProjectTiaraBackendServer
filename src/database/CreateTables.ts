export function CreateTables (dbConnection) {
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
        FOREIGN KEY (\`AccountOwnerID\`) REFERENCES Accounts(\`AccountID\`)
    );`
    const DeviceSubAccessTable = `CREATE TABLE IF NOT EXISTS \`DevicesSubAccess\` (
        \`SubaccessID\` INT NOT NULL AUTO_INCREMENT,
        \`DeviceHWID\` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`AccountAccessee\` INT NOT NULL,
        PRIMARY KEY (\`SubaccessID\`),
        FOREIGN KEY (\`AccountAccessee\`) REFERENCES Accounts(\`AccountID\`)
    );`
    const MetricsTable = `CREATE TABLE IF NOT EXISTS \`DeviceMetrics\` (
        \`MetricID\` INT NOT NULL AUTO_INCREMENT,
        \`Timestamp\` DOUBLE NOT NULL,
        \`MetricType\` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`DeviceID\` INT NOT NULL,
        \`MetricValue\` VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL, 
        PRIMARY KEY (\`MetricID\`),
        FOREIGN KEY (\`DeviceID\`) REFERENCES Devices(\`DeviceID\`)
    );`
    let before = performance.now()
    console.log("[Debug] Creating tables if doesn't exist...")
    dbConnection.query(AccountsTable);
    dbConnection.query(SessionsTable);
    dbConnection.query(DevicesTable);
    dbConnection.query(DeviceSubAccessTable);
    dbConnection.query(MetricsTable);
    console.log("[Debug] Tables created, %sms", (performance.now() - before).toFixed(2))
    
}