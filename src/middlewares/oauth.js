/* eslint-disable camelcase */
/* eslint-disable no-use-before-define */
const superagent = require("superagent");
const users = require("../users.js");

const { CLIENT_ID, CLIENT_SECRET } = process.env;
const API_SERVER = "http://localhost:3000/oauth";

module.exports = async function (req, res, next) {
  try {
    const { code } = req.query;
    console.log("__CODE__:", code);

    const remoteToken = await exchangeCodeForToken(code);
    console.log("__GOOGLE TOKEN__:", remoteToken);

    const remoteUser = await getRemoteUserInfo(remoteToken);
    console.log("__GOOGLE USER__:", remoteUser);

    const [user, token] = await getUser(remoteUser);
    req.token = token;
    req.user = user;

    console.log("__LOCAL USER__:", user);
    next();
  } catch (err) {
    next(`Error: ${err}`);
  }
};

// this will use the access_token github api endpoint
async function exchangeCodeForToken(code) {
  const tokenResponse = await superagent.post("https://www.googleapis.com/oauth2/v4/token")
    .send({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: API_SERVER,
      grant_type: "authorization_code",
    });

  console.log("exchangeCodeForToken Out");

  const { access_token } = tokenResponse.body;
  return access_token;
}

// this will use the user api endpoint to get user info/repo info
async function getRemoteUserInfo(token) {
  // this will use the access token to get user details
  const userResponse = await superagent.get(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`)
    .set("user-agent", "express-app")
    .set("Authorization", `token ${token}`);

  const user = userResponse.body;
  return user;
}

async function getUser(remoteUser) {
  const userRecord = {
    username: remoteUser.email,
    password: "canbeanything",
  };

  const user = await users.save(userRecord);
  const token = users.generateToken(user);

  return [user, token];
}
