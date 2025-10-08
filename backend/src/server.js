const express = require("express");
const cors = require("cors");
const passport = require("passport");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

const authRoutes = require("./api/auth/routes");

app.get("/api/v1/hello", (_req, res) => {
  res.json({ message: "API backend listo" });
});

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
