import NodeMediaServer from "node-media-server";

const STREAMER_CONFIG = {
   rtmp: {
      port: 1935,
      chunk_size: 60000,
      gop_cache: true,
      ping: 60,
      ping_timeout: 90
   },
   http: {
      port: 8000,
      allow_origin: '*',
      mediaroot: './media',

   },
   https: {
      port: 8443,
      key: '/etc/letsencrypt/live/ptserver.capthndsme.xyz/privkey.pem',
      cert: '/etc/letsencrypt/live/ptserver.capthndsme.xyz/fullchain.pem',
   },

   trans: {
      ffmpeg: '/usr/bin/ffmpeg',
      tasks: [
         {
            app: 'live',
            hls: true,
            hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
            hlsKeep: false, // to prevent hls file delete after end the stream
            dash: true,
            dashFlags: '[f=dash:window_size=3:extra_window_size=5]',
            dashKeep: false // to prevent dash file delete after end the stream
         }
      ]
   }
};

let HardwareToStreamMap = [];
module.exports = function (eb, dl) {
   eventBus = eb;
   databaseLayer = dl;
   let nms: NodeMediaServer = new NodeMediaServer(STREAMER_CONFIG);
   nms.run();
   eventBus.on("StreamingDisconnect", (hwid) => {
      console.log("[StreamServer] StreamingDisconnect received for hardware ID", hwid)
      nms.getSession(HardwareToStreamMap[hwid]).stop();
      delete HardwareToStreamMap[hwid];
   });
   console.log("[StreamServer] Module Initialisation succeeded. ")
   nms.on('prePublish', (id, StreamPath, args) => {
      console.log('[StreamServer Ingest Authenticator]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
      // This feels like a dirty hack somehow.
      const streamThings = StreamPath.replace("/live/", "");
       
      const deviceID = args.deviceHwid;
      const deviceKey = args.deviceKey;
      CheckDeviceSessionValidity(
         deviceID,
         deviceKey,
         databaseLayer
      )
         .then((DeviceCheckStatus) => {
            if (DeviceCheckStatus.success) {
               console.log(`[StreamServer Ingest Authenticator] Device ${deviceID} succeeded authentication.`)
               HardwareToStreamMap[deviceID]  = id;
            } else {
               let session = nms.getSession(id);
               console.warn(`[StreamServer Ingest Authenticator] Device did not pass authentication, rejecting stream for hwid ${deviceID}...`)
               session.reject();
            }
         })
         .catch(e => {
            console.warn(`[StreamServer Ingest Authenticator] Database failure, rejecting stream for hwid ${deviceID}...`)
         })
   });
   nms.on('prePlay', (id, StreamPath, args) => {
      console.log('[StreamServer Egress Authenticator]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
 
   });
}


/* 

   Personal notes from the writer (@capthndsme, 2023-03-08)
   :-(
   
   UPDATE 2023-03-23: 
   :-) We resolved things between us and that's good. 

   
*/