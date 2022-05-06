const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const sql = require('mssql');
const cors = require('cors');
const req = require('express/lib/request');
// var Connection = require('tedious').Connection;
// var Request = require('tedious').Request;
// var TYPES = require('tedious').TYPES;
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + "/public"));
app.use(cors());
app.use(function (req, res, next) {
    //Enabling CORS 
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
    next();
});



const config = {
    user: 'sa',
    password: 'database',
    server: '127.0.0.1',
    database: 'ecommerce',
    options: {
        trustedconnection: true,
        enableArithAbort: true,
        instancename: 'SQLEXPRESS'
    },
    port: 1433
}

var database = sql.connect(config, (err) => {
    if (err) {
        console.log(err)
    }
    else {
        console.log("database connected");
        var request = new sql.Request();

        // query to the database and get the records
        request.query('select * from Users', function (err, recordset) {

            if (err) console.log(err)

            // send records as a response
            console.log(recordset.recordsets);

        });
    }
})


// let requset = database.request().query("Select * from Users")
// console.log(requset.recordset);

app.get('/', (req, res) => {
    res.render("index");
})

app.get('/:page', (req, res) => {
    res.render(req.params.page);
})


app.listen(process.env.port || 5000, () => {
    console.log("App Started at port 5000");
});