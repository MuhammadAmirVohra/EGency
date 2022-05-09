const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const passport = require('passport');
const cors = require('cors');
const LocalStrategy = require('passport-local');
const flash = require('connect-flash');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(flash());
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


const mysql = require('mysql');
const e = require('connect-flash');
const { query } = require('express');

const connection = mysql.createConnection({
    // host: "localhost",
    // port: 3306,
    // user: "root",
    // password: "admin",
    // database: "sys"

    host: "db4free.net",
    port: 3306,
    user: "rootuser_egency",
    password: "Admin123",
    database: "egency_database"
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});


app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    function (username, password, done) {
        connection.query('select * from users where email = ?', [username], function (err, user) {

            if (err) { return done(err); }
            if (!user || user.length == 0) { return done(null, false); }
            if (user[0].Password != password) { return done(null, false); }
            return done(null, user[0]);
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});


app.get('/', (req, res) => {


    connection.query('Select * from houses;', (err, data) => {
        if (err) {
            console.log(err);
            req.flash("error", err.message);
            res.send(err.message);
        }
        else {
            res.render('index', { user: req.user, houses: data });
        }
    })

})

// app.get('/success', (req, res) => {
//     res.send(req.user);
// })

app.get("/loginfailed", checkNotAuthenticated, function (req, res) {
    if (!req.user) {
        req.flash("error", "Email or Password is incorrect.");
        res.redirect("/");
    }
});
// app.get('/ico', function (req, res) {/*code*/ });
app.post('/login',
    passport.authenticate('local', { failureRedirect: '/loginfailed' }),
    function (req, res) {
        req.flash("success", "Welcome " + req.user.Name);
        res.redirect('/')
    });

app.get('/logout', checkAuthenticated, function (req, res) {
    req.logout();
    res.redirect('/');
});



app.get('/addagent', checkadmin, (req, res) => {
    res.render("addagent", { user: req.user });
})

app.post('/addagent', upload.single('image'), (req, res) => {


    connection.query("INSERT INTO users (`Name`,`Email`,`Contact`,`Password`,`Picture`,`Address`) VALUES(?, ?, ?, ?, ?, ?); ",
        [req.body.name, req.body.email, req.body.contact, req.body.password, req.file.buffer.toString('base64'), req.body.address],
        (err, data) => {
            if (err) {
                console.log(err);
                req.flash("error", err.message);
                res.redirect('/addagent');
            }
            else {
                req.flash("success", "Agent Added");
                res.redirect('/');
            }
        })

});

app.get('/addhouse', checkAuthenticated, (req, res) => {
    res.render('addhouse', { user: req.user })
})

app.post('/addhouse', upload.fields([{ name: 'image1' }, { name: 'image2' }, { name: 'image3' }]), (req, res) => {



    connection.query("INSERT INTO houses (`Name`, `UserID`, `Address`, `Image1`, `Bedroom`, `Livingroom`, `Parking`, `Kitchen`, `Price`, `Description`, `Image2`, `Image3`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);  ",
        [req.body.name, req.user.ID, req.body.address, req.files['image1'] ? req.files['image1'][0].buffer.toString('base64') : "NULL", req.body.bedroom, req.body.livingroom, req.body.parking, req.body.kitchen, req.body.price, req.body.description, req.files['image2'] ? req.files['image2'][0].buffer.toString('base64') : "NULL", req.files['image3'] ? req.files['image3'][0].buffer.toString('base64') : "NULL"],
        (err, data) => {
            if (err) {
                console.log(err);
                req.flash("error", err.message);
                res.redirect('/addhouse');
            }
            else {
                req.flash("success", "House Successfully Added");
                res.redirect('/');
            }
        })

});
app.get('/agents', (req, res) => {

    connection.query('Select `Name`,`Email`,`Contact`,`Picture`,`Address` from users', (err, data) => {
        if (err) {
            console.log(err);
        }
        else {
            res.render('agents', { agents: data, user: req.user })
        }
    })


})

app.get('/about', (req, res) => {
    res.render('about', { user: req.user })
})

app.get("/property-detail/:id", (req, res) => {
    connection.query('select h.Address, u.Address as PersonAddress, h.Name, u.Name as Person, Livingroom, Kitchen, Bedroom, Parking, Description, Contact, Price, Image1, Image2, Image3 from houses as h inner join users as u on u.ID = h.UserID where h.ID = ? ;', [req.params.id], (err, data) => {
        if (err) {
            req.flash("error", err.message)
            res.redirect('/');
        }
        else {
            console.log(data);
            res.render('property-detail', { user: req.user, data: data[0] });

        }
    })
});


app.get('/contact', (req, res) => {
    res.render('contact', { user: req.user })
})

app.get('/allhouses', (req, res) => {
    connection.query('Select * from houses;', (err, data) => {
        if (err) {
            req.flash("error", err.message)
            res.redirect('/');
        }
        else {
            res.render('allhouses', { user: req.user, houses: data })

        }
    })
})
var filter_data = null;
app.post('/filter', async (req, res) => {
    var query = "Select * from houses where Name like '%" + req.body.search + "%'"
    if (req.body.minimum.length)
        query += " and Price >= " + req.body.minimum
    if (req.body.maximum.length)
        query += " and Price <= " + req.body.maximum


    await connection.query(query, (err, data) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect('/allhouses')
        }
        else {
            filter_data = req.body;
            res.render('allhouses', { user: req.user, houses: data })
        }
    })

})

app.post('/sort_values', async (req, res) => {
    var query = "Select * from houses"
    if (filter_data) {
        query += " where Name like '%" + filter_data.search + "%'"
        if (filter_data.minimum.length)
            query += " and Price >= " + req.body.minimum
        if (filter_data.maximum.length)
            query += " and Price <= " + req.body.maximum
    }
    if (req.body.sort != "Sort by") {
        query += " order by Price "
        if (req.body.sort == 'Price: Low to High')
            query += " ASC"
        else
            query += " DSC"
    }
    console.log(query)

    await connection.query(query, (err, data) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect('/allhouses')
        }
        else {
            res.render('allhouses', { user: req.user, houses: data })
        }
    })
})


app.get('/get_houses_data', (req, res) => {
    console.log("Android App Request")
    connection.query('Select * from houses', (err, data) => {
        if (err) {
            console.log(err.message);
        }
        else {
            console.log(data);
            res.send(data);
        }
    })
})


app.listen(process.env.port || 5000, () => {
    console.log("App Started at port 5000");
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    return res.redirect("/");
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/");
    }
    next();
}

function checkadmin(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.ID == 1) {
            next();

        }
        else
            return res.redirect("/");

    }
    return res.redirect("/");

}