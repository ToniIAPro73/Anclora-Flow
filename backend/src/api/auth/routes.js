const express = require("express");
const passport = require("passport");
const { body, validationResult } = require("express-validator");
const User = require("../../models/User");
const { generateToken, authenticateToken } = require("../../middleware/auth");

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// POST /api/auth/register - Register new user with email/password
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("name").notEmpty().trim(),
    body("password").isLength({ min: 6 }),
    body("language").optional().isIn(["es", "en"]),
    body("theme").optional().isIn(["light", "dark"]),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, name, password, language, theme } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "El email ya está registrado" });
      }

      // Create user
      const user = await User.create({
        email,
        name,
        password,
        authProvider: "local",
        language,
        theme,
      });

      // Generate token
      const token = generateToken(user.id);

      res.status(201).json({
        message: "Usuario registrado correctamente",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          language: user.language,
          theme: user.theme,
        },
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Error al registrar el usuario" });
    }
  }
);

// POST /api/auth/login - Login with email/password
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Verify password
      if (!user.password_hash) {
        return res.status(401).json({
          error: "Esta cuenta utiliza autenticación social. Por favor, inicia sesión con tu proveedor.",
        });
      }

      const isValidPassword = await User.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Update last login
      await User.updateLastLogin(user.id);

      // Generate token
      const token = generateToken(user.id);

      res.json({
        message: "Inicio de sesión exitoso",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatar_url,
          language: user.language,
          theme: user.theme,
        },
      });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ error: "Error al iniciar sesión" });
    }
  }
);

// GET /api/auth/me - Get current user info
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      authProvider: user.auth_provider,
      language: user.language,
      theme: user.theme,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Error al obtener el usuario" });
  }
});

// PUT /api/auth/me - Update current user info
router.put(
  "/me",
  authenticateToken,
  [
    body("name").optional().trim(),
    body("language").optional().isIn(["es", "en"]),
    body("theme").optional().isIn(["light", "dark"]),
  ],
  validate,
  async (req, res) => {
    try {
      const updates = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.language) updates.language = req.body.language;
      if (req.body.theme) updates.theme = req.body.theme;

      const user = await User.update(req.user.id, updates);

      res.json({
        message: "Usuario actualizado correctamente",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          language: user.language,
          theme: user.theme,
        },
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Error al actualizar el usuario" });
    }
  }
);

// OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (_req, res) => {
    res.redirect("/#/dashboard");
  }
);

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/" }),
  (_req, res) => {
    res.redirect("/#/dashboard");
  }
);

module.exports = router;
