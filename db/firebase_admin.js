import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Constrói o caminho para o arquivo de forma segura
const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');

// Lê o arquivo JSON e o converte para um objeto
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK inicializado com sucesso.');
} catch (error) {
  // Evita crashar o app se já estiver inicializado
  if (error.code !== 'app/duplicate-app') {
    console.error('Erro ao inicializar Firebase Admin SDK:', error);
  }
}

export default admin;