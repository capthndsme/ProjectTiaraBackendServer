/**
 * FROM DATABASE:
 * id: number;
 * timestamp: big int;
 * DeviceHWID: VARCHAR
 * action: VARCHAR
 * actionData: VARCHAR
 * actorUsername: VARCHAR
 * */

export type AuditEntry = {
	id: number;
	timestamp: number;
	DeviceHWID: string;
	action: string;
	actionData: string;
	actorUsername: string;
};
