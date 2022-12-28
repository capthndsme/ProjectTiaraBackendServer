const mysql = require('mysql2')
const CreateTables = require('./CreateTables')
class Connection {
    dbConnection;
    dbConf;

    constructor(dbConf) {
        this.dbConf = dbConf
        console.log(`[Debug] Created connection class: ${dbConf.database}`)
    }
    initialise() {
        try {
            this.dbConnection = mysql.createConnection(this.dbConf)
            console.log(`[Debug] Initialised MySQL connection: ${this.dbConf.database}`)
            CreateTables(this.dbConnection)
        } catch(e) {
            console.error(`[Error] Fatal error: MySQL connection cannot be established.`, e)
        }
        
    }
}

module.exports = Connection