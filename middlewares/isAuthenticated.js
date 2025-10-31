const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  console.log(req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = req.headers.authorization.replace("Bearer ", "");
  console.log("TOKEN", token);

  const user = await User.findOne({ token: token }).select("-hash -salt");

  console.log("USER", user);

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.user = user;
  next();
};

module.exports = isAuthenticated;
