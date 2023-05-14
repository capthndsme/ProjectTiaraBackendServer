import { app, express } from "../ExpressInstance";

 


app.use("/preview_images/", express.static("/root/ProjectTiaraBackendServer/preview_images/", {
   index: false,
   setHeaders: (res, path, stat) => {
         res.set("Cache-Control", "public, max-age=31557600");
         // allow download 
         res.set("Content-Disposition", "attachment; filename=\""+path.split("/").pop()+"\"");

   }
}));