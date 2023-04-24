import crypto from "node:crypto"

export function CreateSessionHash (len = 32): Promise<string> {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(len, (err, buf) => {
            if (err) reject(err);
            resolve(buf.toString('hex'));
        })
    });
}