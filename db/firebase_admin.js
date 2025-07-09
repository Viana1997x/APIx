import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// --- CORREÇÃO APLICADA AQUI ---
// Em vez de usar process.cwd(), usamos um caminho relativo à pasta 'db'
// para subir um nível e encontrar o arquivo na raiz do projeto.
const serviceAccountPath = path.join(path.resolve(), 'firebase-service-account.json');

try {
  // Verifica se o arquivo existe antes de tentar ler
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK inicializado com sucesso.');
  } else {
    console.error(`Erro: O arquivo de chave de serviço não foi encontrado em ${serviceAccountPath}. Certifique-se de que ele está na raiz do projeto.`);
    // Opcional: Impede o app de iniciar se a chave for essencial
    // process.exit(1); 
  }
} catch (error) {
  // Evita crashar o app se já estiver inicializado (comum em ambientes de dev com nodemon)
  if (error.code !== 'app/duplicate-app') {
    console.error('Erro ao inicializar Firebase Admin SDK:', error);
  }
}

export default admin;