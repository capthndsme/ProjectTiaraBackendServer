import { getConnection } from "../database/Connection";
const connection = getConnection(); // get mysql2 connection from pool

export function writeAuditEntry(DeviceHWID: string, ActorUsername: string, Action: string, ActionData: string) {
   return new Promise((resolve, reject) => {
      console.log("Auditor: audit entry", DeviceHWID, ActorUsername, Action, ActionData)
      connection.query(
         `INSERT INTO \`PT_Audit_Log\` (\`DeviceHWID\`, \`actorUsername\`, \`action\`, \`actionData\`, \`timestamp\`) VALUES (?, ?, ?, ?, ?)`,
         [DeviceHWID, ActorUsername, Action, ActionData, Date.now()],
         (err, results) => {
            if (err) {
               console.error("[Error] Failed to write audit entry to database.");
               console.error(err);
               
               reject(err);
            } else {
               resolve(results);
            }
         }
      );
   });
}