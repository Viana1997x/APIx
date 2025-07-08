import admin from 'firebase-admin';
// O require é usado aqui pois o SDK pode ter problemas com import de JSON
import serviceAccount from '../firebase-service-account.json' assert { type: 'json' };

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK inicializado com sucesso.');
} catch (error) {
  console.error('Erro ao inicializar Firebase Admin SDK:', error);
}

export default admin;