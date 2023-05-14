import { CheckAccountExists } from "../../dbops/CheckAccountExists";
import { CreateAccount } from "../../dbops/CreateAccount";
import { CreateSession } from "../../dbops/CreateSession";
import { CreateSessionHash } from "../../shared/CreateSessionHash";
import { createPasswordHash } from "../../shared/LoginVerification";
import { RegisterCommand, RegisterResult, RegisterStatus } from "../../types/RegisterResult";
import { app, express } from "../ExpressInstance";

// a simple registration system

app.post("/v1/register", (req: express.Request, res: express.Response) => {
	const json: RegisterCommand = req.body;
	if (json.username && json.password && json.confirm && json.email) {
		if (json.username.length > 3) {
			if (json.username.length < 24) {
				if (json.password.length > 8) {
					const GeneratedPasswordHash = createPasswordHash(json.password).then((hash) => {
						if (json.password === json.confirm) {
                     // All our checks have passed, we can now create the user
                     // Check if the user exists
                     CheckAccountExists(json.username).then((exists) => {
                        if (!exists) {
                           // Create the user, and session hash
                           CreateAccount({
                              email: json.email,
                              username: json.username,
                              passwordHash: hash,
                              name: json.fullName??json.username, 
                              image: json.image??"DEFAULT_IMG"
                           })
                           .then(accountId=> {
                              CreateSession(accountId, json.username, req.headers['x-forwarded-for'].toString() ?? req.ip)
                              .then((sessionHash) => {
                                 const status: RegisterStatus = {
                                    result: RegisterResult.SUCCESS,
                                    sessionHash: sessionHash,
                                    username: json.username,
                                    generatedId: accountId
                                 }
                                 res.send(status);
                              });
                           })
                        } else {
                           const error: RegisterStatus = {
                              result: RegisterResult.ERR_USERNAME_EXISTS,
                           };
                           res.send(error);
                        }
                     })
                     .catch(e=> {
                        const error: RegisterStatus = {
                           result: RegisterResult.ERR_USERNAME_EXISTS,
                        };
                        res.send(error);
                     })
						} else {
							const error: RegisterStatus = {
								result: RegisterResult.ERR_PASSWORD_MISMATCH,
							};
							res.send(error);
						}
					});
				} else {
					const error: RegisterStatus = {
						result: RegisterResult.ERR_SHORT_PASSWORD,
					};
					res.send(error);
				}
			} else {
				const error: RegisterStatus = {
					result: RegisterResult.ERR_LONG_USERNAME,
				};
				res.send(error);
			}
		} else {
			const error: RegisterStatus = {
				result: RegisterResult.ERR_SHORT_USERNAME,
			};
			res.send(error);
		}
	} else {
		const error: RegisterStatus = {
			result: RegisterResult.ERR_TYPE_ERROR,
		};
		res.send(error);
	}
});
