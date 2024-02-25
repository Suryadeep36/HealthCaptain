const express = require('express');

const app = express();
let port = process.env.PORT || 3000;
app.get("/",(req, res) => {
    res.send("Hello World");
})

app.listen(port, () => {
    console.log("App is running at port " + port);
})