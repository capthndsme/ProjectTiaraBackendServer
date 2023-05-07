export type DeviceNotification = {
   id: number,
   hwid: string,
   timestamp: number,
   notification_type: string,
   notification_title: string,
   notification_content: string
}

export enum DeviceNotificationType {
   MESSAGE = "message",
   ALERT = "alert",
   AUTOMATION_TRIGGERED = "automation_triggered",
   AUTOMATION_DONE = "automation_done",
   AUTOMATION_ERROR = "automation_error",
   DIRECT_MESSAGE = "direct_message"
}