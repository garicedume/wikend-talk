const bcrypt = require('bcrypt');
const { getFirestore } = require('firebase-admin/firestore');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{10,}$/;

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula, un número y un símbolo.'
      });
    }

    const db = getFirestore();
    const userRef = db.collection('users').doc(username.trim());
    const doc = await userRef.get();

    if (doc.exists) {
      return res.status(400).json({ error: 'Este nombre de usuario ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = {
      username: username.trim(),
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    await userRef.set(newUser);

    return res.status(201).json({
      success: true,
      message: 'Cuenta creada con éxito.',
      user: { username: newUser.username }
    });
  } catch (error) {
    console.error('[Auth Error]', error);
    return res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    const db = getFirestore();
    const userRef = db.collection('users').doc(username.trim());
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const userData = doc.data();
    const isMatch = await bcrypt.compare(password, userData.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Sesión iniciada con éxito.',
      user: { username: userData.username }
    });
  } catch (error) {
    console.error('[Login Error]', error);
    return res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Usuario no especificado.' });
    }

    const db = getFirestore();
    const userRef = db.collection('users').doc(username.trim());
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'La cuenta no existe.' });
    }

    await userRef.delete();

    return res.status(200).json({
      success: true,
      message: 'Cuenta eliminada permanentemente de la base de datos.'
    });
  } catch (error) {
    console.error('[Delete Error]', error);
    return res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};