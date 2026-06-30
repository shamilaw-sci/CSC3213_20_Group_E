exports.login = (req, res) => {
  const { email, password } = req.body;

  // TEMP TEST LOGIN
  if (email === "admin@gmail.com" && password === "admin123") {
    return res.status(200).json({
      message: "Login successful",
      token: "fake-jwt-token",
    });
  }

  return res.status(401).json({
    message: "Invalid email or password",
  });
};