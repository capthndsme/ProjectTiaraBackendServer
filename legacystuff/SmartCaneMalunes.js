module.exports = function (app) {
   app.get("/smartcane/getcane/:id", getCane);
   app.post("/smartcane/postcane/:id", postCane)
}

let caneData;
function getCane(req, res) {
   if (req.params.id === "e1652a2687bf4198be1d94a0871305de") {
      if (caneData) {
         res.send(caneData);
      } else {
         res.send({
            "status": "error",
            "error": "Device offline"
         });
      }
   } else {
      res.status(403).send({
         "status": "error",
         "error": "Device not found"
      });
     
   }
}
function postCane(req, res) {
   if (req.params.id === "e1652a2687bf4198be1d94a0871305de") {
      caneData = req.body.clientState;
      res.send({
         "status": "success"
      });
   } else {
      res.status(403).send({
         "status": "error",
         "error": "Device not found"
      });
   }
}