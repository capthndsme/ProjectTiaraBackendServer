import { getConnection } from "../database/Connection";
import { Account } from "../types/Account";
const dbConnection = getConnection();

export function CreateAccount (account: Account): Promise<number>{
    return new Promise((resolve, reject) => {
        dbConnection.promise().execute(
            "INSERT INTO Accounts(Email, Username, Password, DisplayName, DisplayImage) Values (?, ?, ?, ?, ?)",
            [
                account.email,
                account.username,
                account.passwordHash,
                account.name,
                account.image
            ]
        )
        .then(([result]) => {

            console.log("Create account trace:", result)
            // @ts-ignore Result is ResultSetHeader, we can safely ignore this (TODO: Investigate why this is happening)
            resolve(result.insertId)
        })
        .catch((e) => reject(e));
    });
}