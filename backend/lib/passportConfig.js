const passport = require("passport");
const Strategy = require("passport-local").Strategy;
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const User = require("../db/User");
const authKeys = require("./authKeys");

// Helper function to filter out unwanted keys from the user object
const filterJson = (obj, unwantedKeys) => {
  const filteredObj = {};
  Object.keys(obj).forEach((key) => {
    if (unwantedKeys.indexOf(key) === -1) {
      filteredObj[key] = obj[key];
    }
  });
  return filteredObj;
};

// Local Strategy (for login)
passport.use(
  new Strategy(
    {
      usernameField: "email",
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
        const user = await User.findOne({ email: email }).exec();

        if (!user) {
          return done(null, false, {
            message: "User does not exist",
          });
        }

        // Verify password using the user-defined login method
        try {
          await user.login(password); // assuming user.login() is a promise-based function
          user["_doc"] = filterJson(user["_doc"], ["password", "__v"]);
          return done(null, user);
        } catch (err) {
          return done(err, false, {
            message: "Password is incorrect.",
          });
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

// JWT Strategy (for protected routes using JWT token)
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: authKeys.jwtSecretKey,
    },
    async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload._id).exec();

        if (!user) {
          return done(null, false, {
            message: "JWT Token does not exist",
          });
        }

        user["_doc"] = filterJson(user["_doc"], ["password", "__v"]);
        return done(null, user);
      } catch (err) {
        return done(err, false, {
          message: "Incorrect Token",
        });
      }
    }
  )
);

module.exports = passport;
