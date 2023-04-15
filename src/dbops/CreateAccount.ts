import { getConnection } from "../database/Connection";
import { Account } from "../types/Account";
let dbConnection = getConnection();

// We dont know what mysql2's return type is, so we use any
export function CreateAccount (account: Account): Promise<any> {
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
        .then((result) => {
            resolve(result);
        })
        .catch((e) => reject(e));
    });
}