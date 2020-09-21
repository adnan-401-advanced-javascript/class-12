/* eslint-disable no-use-before-define */
const superagent = require("superagent");
const users = require("../users.js");

const { CLIENT_ID, CLIENT_SECRET } = process.env;
const API_SERVER = "http://localhost:3000/oauth";

module.exports = async function (req, res, next) {
  try {
    const { code } = req.query;
    console.log("__CODE__:", code);

    let remoteToken = await exchangeCodeForToken(code);
    console.log('__GOOGLE TOKEN__:', remoteToken);

    let remoteUser = await getRemoteUserInfo(remoteToken);
    console.log('__GOOGLE USER__:', remoteUser);

    const [user, token] = await getUser(remoteUser);
    req.token = token;
    req.user = user;

    console.log('__LOCAL USER__:', user);
    next();
  } catch(err) {
    next(`Error: ${err}`);
  }
}

// this will use the access_token github api endpoint
async function exchangeCodeForToken(code) {
  let tokenResponse = await superagent.post('https://www.googleapis.com/oauth2/v4/token')
    .send({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: API_SERVER,
      grant_type: 'authorization_code'
    })

    console.log("exchangeCodeForToken Out");

  let access_token = tokenResponse.body.access_token;
  return access_token;
}

// this will use the user api endpoint to get user info/repo info
async function getRemoteUserInfo(token) {
  // this will use the access token to get user details
  console.log("before");
  let userResponse = await superagent.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`)
    .set('user-agent', 'express-app')
    .set('Authorization', `token ${token}`);
    console.log("after");

  let user = userResponse.body;
  return user;
}

async function getUser(remoteUser) {
  // this will actually save the user to the db and return user details from the db
  let userRecord = {
    username: remoteUser.login,
    password: 'canbeanything'
  }

  let user = await users.save(userRecord);
  // this is meant for us to generate a final user token to access routes in our app
  // tomorrow: this is will be used in the format of a Bearer Authentication Token
  let token = users.generateToken(user);

  return [user, token];
}
