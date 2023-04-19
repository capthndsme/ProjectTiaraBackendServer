import mysql from 'mysql2'
import { dbConfig } from '../config';
import { CreateTables } from './CreateTables';


console.log("Database Connection file loaded")

let dbConnection: mysql.Pool; 
export function initialise() {
    console.log("[PTServer Database] Initialising database connection")
    try {
        dbConnection = mysql.createPool(dbConfig)
        console.log(`[Debug] Initialised MySQL pool: ${dbConfig.database}`)
        CreateTables(dbConnection)
    } catch(e) {
        console.error(`[Error] Fatal error: MySQL connection cannot be established.`, e)
    }
}


export function getConnection(): mysql.Pool {
    if (!dbConnection) {
        console.log("[PTServer Database] Attempted to get database connection before initialising, initialising now.");
 
        initialise();
    }
    return dbConnection;
}