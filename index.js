const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + "/public"));

app.get('/', (req, res) => {
    res.render("index");
})

app.get('/:page', (req, res) => {
    res.render(req.params.page);
})


app.listen(process.env.port || 5000, () => {
    console.log("App Started at port 5000");
});