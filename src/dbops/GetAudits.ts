import { getConnection } from "../database/Connection";
import { AuditEntry } from "../types/AuditEntry";
const connection = getConnection(); // get mysql2 connection from pool

export function GetAudits(DeviceHWID: string): Promise<AuditEntry[]>{
   return new Promise((resolve, reject) => {
      connection
         .promise()
         .execute("SELECT * FROM PT_Audit_Log WHERE DeviceHWID = ? ORDER BY timestamp DESC", [DeviceHWID])
         .then(([rows, fields]) => {
            if (Array.isArray(rows)) {
               resolve(rows as AuditEntry[]);
            } else {
               reject("Invalid response from database.");
               console.error("Invalid response from database.")
            }
         });
   });
}