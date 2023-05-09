// server/index.js

const express = require('express');
const app = express();

// Define una ruta que devuelve datos
app.get('/datos', (req, res) => {
  const datos = { mensaje: 'Hola desde el servidor!' };
  res.json(datos);
});

// Inicia el servidor
app.listen(3001, () => {
  console.log('Servidor iniciado en el puerto 3001');
});