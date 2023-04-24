import { getConnection } from "../database/Connection";
import { NotificationTypes } from "../types/NotificationTypes";
const dbConnection = getConnection();
export function InsertNotification (DeviceID: string, Title: string, Message: string, Type: NotificationTypes) {
   return new Promise((resolve, reject) => {
      const query = `INSERT INTO PT_Notification_Table (timestamp, notification_type, notification_title, notification_content) VALUES (?, ?, ?, ?)`;
      const timestamp = Date.now();
      const type = Type;
      const title = Title;
      const content = Message;
      dbConnection.promise().query(query, [timestamp, type, title, content])
         .then(result => {
            resolve(result);
         })
         .catch(e=>{
            console.log("Saving notification failed");
         })
   });

}