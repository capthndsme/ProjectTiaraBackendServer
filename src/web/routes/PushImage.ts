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
import sharp from "sharp";
import fs from "node:fs";
import { app } from "../ExpressInstance";
import { CheckDeviceSessionValidity } from "../../dbops/CheckDeviceSessionValidity";
import { broadcastMessageToHWID, findSubscribedClientSocket } from "../../ws/ClientSocketList";
import { InsertSnapshotsForDevice } from "../../dbops/InsertSnapshotsForDevice";
const Multer = multer({
	dest: os.tmpdir(),
	limits: {
		fileSize: 1024 * 1024 * 32, // 32MB
	},
});

app.post("/v1/cameraPreviews/push", Multer.single("file"), (req, res) => {
	const deviceHwid = req.headers["x-device-hwid"] as string;
	const deviceSession = req.headers["x-device-session"] as string;
	const file = req.file;
	const saveFN = `${deviceHwid}-${Date.now()}`;
	console.log("File", file);
	console.log("Device HWID", deviceHwid);
	console.log("Device Session", deviceSession);
	// Base path
	let savePath = `/root/ProjectTiaraBackendServer/preview_images/${saveFN}.jpg`;

	//saveCopy: a small copy of the image, for the web client to display.
	let saveCopy = `/root/ProjectTiaraBackendServer/preview_images/${deviceHwid}.jpg`;
	// Previews section
	let previewMedium = `/root/ProjectTiaraBackendServer/preview_images/${saveFN}-medium.jpg`;
	let previewSmall = `/root/ProjectTiaraBackendServer/preview_images/${saveFN}-small.jpg`;
	let previewMicro = `/root/ProjectTiaraBackendServer/preview_images/${saveFN}-micro.jpg`;
	console.log("File", file);
	if (file && deviceHwid && deviceSession) {
		CheckDeviceSessionValidity(deviceHwid, deviceSession).then((valid) => {
			if (valid.success) {
				// Save file
				// We don't need to worry about savePath injection because, device HWID wouldn't have any special characters.

				fs.rename(file.path, savePath, (err: any) => {
					if (err) {
						res.status(500).json({
							success: false,
							message: "Failed to save image",
						});
					} else {
						fs.readFile(savePath, (err: any, data) => {
							if (!err) {
                        const previewCopy = sharp(data)
                           .resize(1024, null) // Autoscale
                           .jpeg({
                              quality: 80,
                           })
                           .toFile(saveCopy);
								const med = sharp(data)
									.resize(2048, null) // Autoscale
									.jpeg({
										quality: 85,
									})
									.toFile(previewMedium);
								const small = sharp(data)
									.resize(768, null) // Autoscale
									.jpeg({
										quality: 75,
									})
									.toFile(previewSmall);
								const micro = sharp(data)
									.resize(256, null) // Autoscale
									.jpeg({
										quality: 75,
									})
									.toFile(previewMicro);

								Promise.allSettled([previewCopy, med, small, micro]).then(() => {
									// We dont care if snapshots failed to save, because we already have the original image.
									InsertSnapshotsForDevice({
										hwid: deviceHwid,
										fileHash: saveFN,
										timestamp: Date.now(),
										cdn: "https://ptserver.capthndsme.xyz/preview_images/",
									}).then(() => {
										broadcastMessageToHWID(deviceHwid, "CameraPreviewUpdated", {});
										res.status(200).json({
											success: true,
											message: "Image saved",
										});
									});
								});
							} else {
								InsertSnapshotsForDevice({
									hwid: deviceHwid,
									fileHash: saveFN,
									timestamp: Date.now(),
									cdn: "https://ptserver.capthndsme.xyz/preview_images/",
								}).then(() => {
									broadcastMessageToHWID(deviceHwid, "CameraPreviewUpdated", {});
									res.status(200).json({
										success: true,
										message: "Image saved",
									});
								});
							}
						});
					}
				});
			} else {
				res.status(401).json({
					success: false,
					message: "Invalid device or database layer error",
				});
			}
		});
	} else {
		res.status(400).json({
			success: false,
			message: "Missing parameters",
		});
	}
});
