import http from 'http';
import https from 'https';
import fs from 'fs'; // Módulo para interagir com o sistema de arquivos
import path from 'path'; // Módulo para lidar com caminhos de arquivos
import crypto from 'crypto'; // Módulo para criar nomes de arquivo únicos

const CACHE_DIR = path.join(process.cwd(), 'cache');
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

class webReader {
  // Função para criar um nome de arquivo seguro a partir de uma URL
  static #getCachePath(url) {
    const hash = crypto.createHash('sha256').update(url).digest('hex');
    return path.join(CACHE_DIR, `${hash}.html`);
  }

  static readWebsite(url) {
    return new Promise((resolve, reject) => {
      // 1. Garante que a pasta de cache exista
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR);
      }

      const cachePath = this.#getCachePath(url);

      // 2. Verifica se uma versão em cache existe e se ainda é válida
      if (fs.existsSync(cachePath)) {
        const stats = fs.statSync(cachePath);
        const ageInMs = Date.now() - stats.mtimeMs;

        if (ageInMs < CACHE_DURATION_MS) {
          // Cache é válido, lê o arquivo local e retorna
          console.log(`(Cache HIT) Lendo: ${url}`);
          const cachedData = fs.readFileSync(cachePath, 'utf8');
          return resolve(cachedData);
        }
      }

      // 3. Se o cache não existir ou estiver expirado, baixa da internet
      console.log(`(Cache MISS) Baixando: ${url}`);
      let client = http;
      if (url.toString().startsWith('https')) {
        client = https;
      }

      client.get(url, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
          data += chunk;
        });
        resp.on('end', () => {
          // 4. Salva os novos dados no cache para uso futuro
          fs.writeFileSync(cachePath, data);
          resolve(data);
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }
}

export default webReader;