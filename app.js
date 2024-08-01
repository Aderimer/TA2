const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const expressLayout = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const session = require('express-session');

// Creates instance and determins what port to open
const app = express();
const PORT = process.env.PORT || 3000;

// Bodyparses for search & possbily more
const jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: true })




// Templating & View Engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('adminLayout', './layouts/admin');
app.set('view engine', 'ejs');

// Database connection
const connectDB = require('./server/config/db');
connectDB();

// Middleware
app.use(urlencodedParser);
app.use(jsonParser);
app.use(cookieParser());
app.use(methodOverride('_method'));


app.use(session({
    secret: 'beep-boop',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
    cookie: { maxAge: 3600000000 }
}))


app.use('/', require('./server/routes/main'));
app.use('/admin', require('./server/routes/admin'));




// Also middleware - Do not move to other middleware, that breaks stuff... :)
app.use(methodOverride('_method'));

app.use('/public/img/', express.static('./public/img/'));
app.use(express.static('public'));


app.listen(PORT, ()=> {
    console.log(`Listening on port ${PORT}`);
    console.log(`Website open on http://127.0.0.1:${PORT}`);
});

