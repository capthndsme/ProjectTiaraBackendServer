import bcrypt from "bcrypt";

export function createPasswordHash(password:string): Promise<string> {
	return new Promise((resolve) => {
		bcrypt.genSalt(11).then((salt) => {
			bcrypt.hash(password, salt).then((hash) => resolve(hash));
		});
	});
}

export function verifyPassword(password: string, hashedPassword:string): Promise<boolean> {
	return new Promise((resolve) => {
		bcrypt.compare(password, hashedPassword).then((result) => resolve(result));
	});
}
