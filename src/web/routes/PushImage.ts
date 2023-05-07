/**
 * Push Image Endpoint
 * /v1/cameraPreviews/push
 * parameters: { deviceHwid: string, deviceSession: string, image: File }
 * Our Device sends a POST request to this endpoint with the image file every 1 minute, 
 * when the device is not streaming.
 * 
 * Additionally, when a web client logs in to the backend, we should emit 
 * a websocket event, so it's always a latest preview.
 * 
 * Lastly, we should emit a websocket to clients that subscribed to a particular device,
 * letting them know that the device has updated a new image.
 */
import os from "node:os";
import multer from "multer";
import fs from "node:fs"
import { app } from "../ExpressInstance";
import { CheckDeviceSessionValidity } from "../../dbops/CheckDeviceSessionValidity";
import { findSubscribedClientSocket } from "../../ws/ClientSocketList";
const upload = multer({ dest: os.tmpdir() });
app.post("/v1/cameraPreviews/push", upload.single("file"), (req, res) => {
   if (req.headers.devicehwid === undefined || req.headers.devicesession === undefined) {
      // Simple typecheck
      res.status(400).json({
         success: false,
         message: "Missing parameters",
      });
      return;
   }
   console.log("Received image from device", req);
   const deviceHwid = req.headers.devicehwid as string;
   const deviceSession = req.headers.deviceSession as string;
   const file = req.file;
   const saveFN = `${deviceHwid}-${Date.now()}`
   let savePath = `/root/ProjectTiaraBackendServer/preview_images/${saveFN}.jpg`;
   let saveCopy = `/root/ProjectTiaraBackendServer/preview_images/${deviceHwid}.jpg`;
   if (file && deviceHwid && deviceSession) { 
      CheckDeviceSessionValidity(deviceHwid, deviceSession)
      .then((valid) => {
         if (valid.success) {
            // Save file
            // We don't need to worry about savePath injection because, device HWID wouldn't have any special characters.
            // Just in case, lets filter out anything that isn't alphanumeric.
            savePath = savePath.replace(/[^a-zA-Z0-9]/g, "");
            fs.rename(file.path, savePath, (err: any) => {
               if (err) {
                  res.status(500).json({
                     success: false,
                     message: "Failed to save image",
                  });
               } else {
                  fs.copyFile(savePath, saveCopy, (err: any) => {
                     console.log("Copied file to", saveCopy);
                     findSubscribedClientSocket(deviceHwid)
                     ?.socket
                     .emit("CameraPreviewUpdated", {saveFN: saveFN});
                     res.status(200).json({
                        success: true,
                        message: "Image saved",
                     });
                  });
                  
               }
            });
         } else {
            res.status(401).json({
               success: false,
               message: "Invalid device or database layer error",
            });
         }
      })
   } else {
      res.status(400).json({
         success: false,
         message: "Missing parameters",
      });
   }
});