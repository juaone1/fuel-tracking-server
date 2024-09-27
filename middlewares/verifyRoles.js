const verifyRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req?.role) return res.status(401).send({ error: "Unauthorized" });
    const result = allowedRoles.some((role) => role === req.role);
    if (!result) return res.status(401).send({ error: "Unauthorized" });
    next();
  };
};

module.exports = verifyRoles;
