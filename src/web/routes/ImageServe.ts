import { app, express } from "../ExpressInstance";

 


app.use("/preview_images/", express.static("/root/ProjectTiaraBackendServer/preview_images/", {
   index: false
}));