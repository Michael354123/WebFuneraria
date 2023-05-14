//server/index.js
const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const session = require('express-session');

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // Reemplaza con la URL de tu cliente
  credentials: true, // Habilita el envío de cookies
}));

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'ssm354123',
  database: 'funeraria',
});

db.connect((error) => {
  if (error) {
    console.error('Error al conectar a la base de datos: ', error);
  } else {
    console.log('Conexión exitosa a la base de datos.');
  }
});

// Configuración de Express Session
app.use(
  session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Si usas HTTPS, establece esto en 'true'
      maxAge: 3600000, // Tiempo de vida de la sesión en milisegundos
    },
  })
);

// Ruta de inicio de sesión
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Verificar las credenciales en la base de datos
  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], (error, results) => {
    if (error) {
      console.error('Error al consultar la base de datos: ', error);
      res.status(500).json({ error: 'Error del servidor' });
    } else {
      if (results.length === 0) {
        res.status(401).json({ error: 'No se encontró al usuario' });
      } else {
        const user = results[0];

        // Convertir la contraseña almacenada en binario a cadena de texto
        const storedPassword = user.password.toString('utf-8');

        // Verificar la contraseña
        bcrypt.compare(password, storedPassword, (err, match) => {
          if (err) {
            console.error('Error al comparar contraseñas: ', err);
            res.status(500).json({ error: 'Error del servidor' });
          } else if (!match) {
            res.status(401).json({ error: 'Contraseña incorrecta' });
          } else {
            req.session.userId = user.id;
            req.session.userName = user.name;
            req.session.type = user.type;

            res.sendStatus(200);
          }
        });
      }
    }
  });
});
// Ruta de Registro de usuario
app.post('/register', (req, res) => {
  const { username, password, type } = req.body;

  // Verificar si el usuario ya existe en la base de datos
  const checkQuery = 'SELECT * FROM users WHERE username = ?';
  db.query(checkQuery, [username], (error, results) => {
    if (error) {
      console.error('Error al consultar la base de datos: ', error);
      res.status(500).json({ error: 'Error del servidor' });
    } else {
      if (results.length > 0) {
        res.status(409).json({ error: 'El usuario ya existe' });
      } else {
        bcrypt.genSalt(10, (err, salt) => {
          if (err) {
            console.error('Error al generar salt: ', err);
            res.status(500).json({ error: 'Error del servidor' });
          } else {
            bcrypt.hash(password, salt, (err, hashedPassword) => {
              if (err) {
                console.error('Error al encriptar la contraseña: ', err);
                res.status(500).json({ error: 'Error del servidor' });
              } else {
                // Convertir la contraseña en un buffer binario
                const passwordBuffer = Buffer.from(hashedPassword, 'utf-8');

                // Insertar el nuevo usuario en la base de datos
                const insertQuery = 'INSERT INTO users (username, password, type) VALUES (?, ?, ?)';
                db.query(insertQuery, [username, passwordBuffer, type], (error) => {
                  if (error) {
                    console.error('Error al insertar el usuario en la base de datos: ', error);
                    res.status(500).json({ error: 'Error del servidor' });
                  } else {
                    res.json({ message: 'Usuario registrado correctamente' });
                  }
                });
              }
            });
          }
        });
      }
    }
  });
});

app.get('/user', (req, res) => {
  // Obtener los datos de la sesión
  const userId = req.session.userId;
  const userName = req.session.userName;
  const type = req.session.type;

  // Mostrar los datos en la respuesta
  res.json({ userId, userName, type });
});

// Inicia el servidor
app.listen(3001, () => {
  console.log('Servidor iniciado en el puerto 3001');
});