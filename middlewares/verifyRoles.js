const verifyRoles = (allowedRoles) => {
  return (req, res, next) => {
    console.log("req.roles", req.role);
    if (!req?.role) return res.sendStatus(401);
    const result = allowedRoles.some((role) => role === req.role);
    if (!result) return res.sendStatus(401);
    next();
  };
};

module.exports = verifyRoles;
