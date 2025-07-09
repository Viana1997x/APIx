import express from 'express';
import admin from '../db/firebase_admin.js';

const router = express.Router();

// Defina uma chave secreta para proteger a rota
const CRON_SECRET = "HeikeSmirnoxTheLiberator";

router.get('/cleanup-users', async (req, res) => {
    // 1. Protege a rota
    const secret = req.query.secret;
    if (secret !== CRON_SECRET) {
        return res.status(403).send({ error: 'Acesso não autorizado.' });
    }

    console.log("Iniciando a verificação de usuários não verificados...");

    const ONE_HOUR_IN_MS = 60 * 60 * 1000;
    let usersToDelete = [];

    try {
        let nextPageToken;
        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            listUsersResult.users.forEach((user) => {
                const creationTime = new Date(user.metadata.creationTime).getTime();
                const isOldEnough = (Date.now() - creationTime) > ONE_HOUR_IN_MS;

                if (!user.emailVerified && isOldEnough) {
                    usersToDelete.push(user.uid);
                }
            });
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        if (usersToDelete.length > 0) {
            await admin.auth().deleteUsers(usersToDelete);
            console.log(`Excluídos com sucesso: ${usersToDelete.length} usuários.`);
            return res.status(200).send({ message: `Excluídos: ${usersToDelete.length} usuários.` });
        } else {
            console.log("Nenhum usuário para excluir.");
            return res.status(200).send({ message: "Nenhum usuário para excluir." });
        }
    } catch (error) {
        console.error("Erro ao listar ou excluir usuários:", error);
        return res.status(500).send({ error: 'Erro no processo de limpeza.' });
    }
});

export default router;