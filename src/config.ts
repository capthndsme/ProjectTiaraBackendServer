type dbConfig = {
    host: string,
    user: string,
    password: string,
    database: string,
    waitForConnections: boolean,
    connectionLimit: number,
}

export const dbConfig: dbConfig = {
    "host": "localhost",
    "user": "ptdbuser",
    "password": "ptpassword123",
    "database": "ptdb",
    "waitForConnections": true,
    "connectionLimit": 20,
}

type appConfig = {
    port: number,
}
export const appConfig: appConfig = {
    port: 8080
}


