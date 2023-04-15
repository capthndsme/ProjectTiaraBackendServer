import mysql from 'mysql2'
import { dbConfig } from '../config';
import { CreateTables } from './CreateTables';


console.log("Database Connection file loaded")

let dbConnection: mysql.Pool; 
export function initialise() {
    try {
        dbConnection = mysql.createPool(dbConfig)
        console.log(`[Debug] Initialised MySQL pool: ${dbConfig.database}`)
        CreateTables(dbConnection)
    } catch(e) {
        console.error(`[Error] Fatal error: MySQL connection cannot be established.`, e)
    }
}


export function getConnection(): mysql.Pool {
    return dbConnection;
}