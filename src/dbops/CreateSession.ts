import { getConnection } from "../database/Connection";
let dbConnection = getConnection();
import { CreateSessionHash } from "../shared/CreateSessionHash";

function CreateSession (accountId: string, username: string, IP: string): Promise<string> {
    return new Promise((resolve, reject) => {
        CreateSessionHash().then((hash) => {
            dbConnection.promise().execute(
                "INSERT INTO Sessions (AccountID, Username, Session, IPAddress) VALUES (?, ?, ?, ?)",
                [accountId, username, hash, IP]
            ).then(() => {
                resolve(hash)
            })
        })
    });

}