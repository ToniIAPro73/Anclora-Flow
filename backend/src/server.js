const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/api/v1/hello', (req, res) => {
  res.json({ message: "¡API Backend funcional! 🚀" });
});

app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
