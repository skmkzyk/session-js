const express = require('express');
const session = require('express-session');
const redis = require('redis');
const connectRedis = require('connect-redis');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const RedisStore = connectRedis(session);
const redisClient = redis.createClient(6380,
  process.env.REDISCACHEHOSTNAME,
  {
    auth_pass: process.env.REDISCACHEKEY,
    tls: {
      servername: process.env.REDISCACHEHOSTNAME
    }
  });
redisClient.on('connect', (err) =>
{
  console.log('connected to redis successfully');
})
redisClient.on('error', (err) =>
{
  console.log('Could not establish a connection with redis.');
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'secret1234',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: false,
    maxAge: 1000 * 60 * 10
  }
}));

app.get("/", (req, res) => {
  sess = req.session;
  if (sess.username && sess.password) {
      res.write(`<h1>Welcome ${sess.username} </h1><br>`)
      res.write(`<h3>This is the Home page</h3>`);
      if (sess.lastaccesstime) {
         res.write(`<p>last access time: ${sess.lastaccesstime.toString()}</p>`);
      }
      sess.lastaccesstime = new Date();
      res.end('<a href=' + '/logout' + '>Click here to log out</a >')
  } else {
      res.sendFile(__dirname + "/login.html")
  }
});

app.post("/login", (req, res) => {
  sess = req.session;
  if ((req.body.username === 'admin') &&
      (req.body.password === 'password')) {
        sess.username = req.body.username
        sess.password = req.body.password
        res.end("success")      
  } else {
    res.statusCode = 401;
    res.end('auth error');
  }
});
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
      if (err) {
          return console.log(err);
      }
      res.redirect("/")
  });
});

const server = app.listen(8080, () => {
  const host = server.address().address;
  const port = server.address().port
  console.log(`http://${host}:${port}`);
});
