export enum RegisterResult {
   ERR_SHORT_USERNAME = "Username must be at least 3 characters long",
   ERR_LONG_USERNAME = "Username must be less than 24 characters long",
   ERR_SHORT_PASSWORD = "Password must be at least 8 characters long",
   ERR_USERNAME_EXISTS = "Username already exists",
   ERR_PASSWORD_MISMATCH = "Passwords do not match",
   ERR_TYPE_ERROR = "There was an error processing your request (Your request was not a valid RegisterCommand, see the TypeScript definition for RegisterCommand)",
   SUCCESS = "Success",
   BACKEND_ERROR = "There was an error processing your request (BACKEND_ERROR)",
}

export interface RegisterCommand {
   username: string;
   password: string;
   confirm: string;
   email: string;
   fullName?: string;
   image?: string;
}

export interface RegisterStatus {
   result: RegisterResult;
   generatedId?: number;
   username?: string;
   sessionHash?: string;
}