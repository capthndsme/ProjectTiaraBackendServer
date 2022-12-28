module.exports = function(dbConnection) {
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
        \`Session\` BINARY(32) NOT NULL,
        \`IPAddress\` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        PRIMARY KEY (\`SessionID\`),
        FOREIGN KEY (\`AccountID\`) REFERENCES Accounts(\`AccountID\`)
    );`;
    const DevicesTable = `CREATE TABLE IF NOT EXISTS \`Devices\` (
        \`DeviceID\` INT NOT NULL AUTO_INCREMENT,
        \`AccountOwnerID\` INT NOT NULL,
        \`DeviceHWID\` VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        \`DeviceToken\` BINARY(32) NOT NULL,
        PRIMARY KEY (\`DeviceID\`),
        FOREIGN KEY (\`AccountOwnerID\`) REFERENCES Accounts(\`AccountID\`)
    );`
    console.log("[Debug] Creating tables...")
    dbConnection.query(AccountsTable);
    dbConnection.query(SessionsTable);
    dbConnection.query(DevicesTable);
    console.log("[Debug] Tables created")
    
}