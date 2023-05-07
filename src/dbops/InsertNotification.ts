import { getConnection } from "../database/Connection";
import { NotificationEntity } from "../types/NotificationEntity";
import { NotificationType } from "../types/NotificationType";
import { NotificationTypes } from "../types/NotificationTypes";
const dbConnection = getConnection();
export function InsertNotification (notification: NotificationEntity, hwid: string): Promise<boolean> {
   return new Promise((resolve, reject) => {
      const query = `INSERT INTO PT_Notification_Table (hwid,sentTimestamp, type, title, message) VALUES (?, ?, ?, ?, ?)`;
      const timestamp = notification.sentTimestamp;
      const type = notification.type;
      const title = notification.title;
      const content = notification.message;
      dbConnection.promise().query(query, [hwid, timestamp, type, title, content])
         .then(result => {
            resolve(true);
         })
         .catch(e=>{
            console.log("Saving notification failed, error: ", e);
            resolve(false);
         })
   });

}