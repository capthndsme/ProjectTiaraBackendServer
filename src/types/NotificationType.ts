export enum NotificationType {
   // Automations and Triggers System
   AUTOMATION_STARTED = "AUTOMATION_STARTED",
   AUTOMATION_FINISHED = "AUTOMATION_FINISHED",
   AUTOMATION_ERROR = "AUTOMATION_ERROR",

   // Temperature threshold system
   REACHED_HIGH_TEMP_THRESHOLD = "HIGH_TEMP_THRESHOLD",
   REACHED_LOW_TEMP_THRESHOLD = "LOW_TEMP_THRESHOLD",

   // Messaging system
   DIRECT_MESSAGE = "DIRECT_MESSAGE",

   // System Startup
   SYSTEM_STARTED = "SYSTEM_STARTED"
}