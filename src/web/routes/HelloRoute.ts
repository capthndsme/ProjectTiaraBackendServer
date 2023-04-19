import { app } from "../ExpressInstance";

app.get("/hello", (req, res) => {
    res.send("Hello World!");
}); 