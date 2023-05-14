// NodeMediaServer types seems to be broken, so we're using require() instead of import.
// grr... i want types :/
const NodeMediaServer = require("node-media-server");
import { SharedEventBus } from "../components/SharedEventBus";
import { CheckDeviceSessionValidity } from "../dbops/CheckDeviceSessionValidity";
import { addToDeviceStreamList, findDeviceStream, removeFromDeviceStreamList } from "./DeviceStreams";

const STREAMER_CONFIG = {
	rtmp: {
		port: 1935,
		chunk_size: 60000,
		gop_cache: true,
		ping: 60,
		ping_timeout: 90,
	},
	http: {
		port: 8000,
		allow_origin: "*",
		mediaroot: "./media",
	},
	https: {
		port: 8443,
		key: "/etc/letsencrypt/live/ptserver.capthndsme.xyz/privkey.pem",
		cert: "/etc/letsencrypt/live/ptserver.capthndsme.xyz/fullchain.pem",
	},

	trans: {
		ffmpeg: "/usr/bin/ffmpeg",
		tasks: [
			{
				app: "live",
				hls: true,
 
				hlsFlags: "[hls_time=3:hls_list_size=5:hls_flags=delete_segments]",
				hlsKeep: false, // to prevent hls file delete after end the stream
				dash: true,
				dashFlags: "[f=dash:window_size=3:extra_window_size=5]",
				dashKeep: false, // to prevent dash file delete after end the stream
			},
		],
	},
};

// I am not sure if we are going to export this, so we are going to keep it private for now.
 
interface deviceStreamCallbacks {
	deviceHwid: string;
	callback: () => void;
}
let deviceStreamCallback: deviceStreamCallbacks[] = [];


export function waitForDeviceToStream(deviceHwid: string): Promise<void> {
	return new Promise((resolve) => {
		const waitTimeout = setTimeout(() => {
			console.log("Timeout waiting for device to stream.");
			resolve();
		}, 15000);

		deviceStreamCallback.push({
			deviceHwid: deviceHwid,
			callback: () => {
				clearTimeout(waitTimeout);
				resolve();
			}
		})
	});
}

export function startStreamingServer() {
	const nms = new NodeMediaServer(STREAMER_CONFIG);
	nms.run();
	SharedEventBus.on("StreamingDisconnect", (hwid) => {
		console.log("[StreamServer] StreamingDisconnect received for hardware ID", hwid);
		nms.getSession(findDeviceStream(hwid)).stop();
		removeFromDeviceStreamList(hwid);
	});
	console.log("[StreamServer] Module Initialisation succeeded. ");
	nms.on("prePublish", (id, StreamPath, args) => {
		console.log("[StreamServer Ingest Authenticator]", `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
		// This feels like a dirty hack somehow.
		const streamThings = StreamPath.replace("/live/", "");
		const deviceID = args.deviceHwid;
		const deviceKey = args.deviceKey;
		CheckDeviceSessionValidity(deviceID, deviceKey)
			.then((DeviceCheckStatus) => {
				if (DeviceCheckStatus.success) {
					console.log(`[StreamServer Ingest Authenticator] Device ${deviceID} succeeded authentication with key ${deviceKey}.`);
					deviceStreamCallback.forEach((callback) => {
						if (callback.deviceHwid === deviceID) {
							callback.callback();
						}
					});
				} else {
					const session = nms.getSession(id);
					console.warn(
						`[StreamServer Ingest Authenticator] Device did not pass authentication, rejecting stream for hwid ${deviceID}...`
					);
               // We reject the stream here.
					session.reject();
				}
			})
			.catch((e) => {
				console.warn(`[StreamServer Ingest Authenticator] Database failure, rejecting stream for hwid ${deviceID}...`);
			}); 
	});
 
   // prePlay event is not really working for transcoded streams, so we're not using it until the 
   // authors of NodeMediaServer fix it. Or maybe I am doing something wrong.
   // 
	nms.on("prePlay", (id, StreamPath, args) => {
		console.log("[StreamServer Egress Authenticator]", `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
	});
}
