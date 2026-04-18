import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── تعديل حد حجم البيانات في milliparsec ──
const milliparsecPath = resolve(__dirname, 'node_modules/milliparsec/dist/index.js');
if (existsSync(milliparsecPath)) {
    let code = readFileSync(milliparsecPath, 'utf-8');
    if (code.includes('const defaultPayloadLimit = 102400;')) {
        code = code.replace('const defaultPayloadLimit = 102400;', 'const defaultPayloadLimit = 10485760;');
        writeFileSync(milliparsecPath, code);
        console.log(chalk.green('تم زيادة حد حجم البيانات إلى 10MB'));
    }
}

// ── تشغيل json-server ──
const { Low } = await import('lowdb');
const { JSONFile } = await import('lowdb/node');
const { createApp } = await import('json-server/lib/app.js');
const { NormalizedAdapter } = await import('json-server/lib/adapters/normalized-adapter.js');
const { Observer } = await import('json-server/lib/adapters/observer.js');

const dbFile = resolve(__dirname, 'database/db.json');
const observer = new Observer(new NormalizedAdapter(new JSONFile(dbFile)));
const db = new Low(observer, {});
await db.read();

const PORT = 3001;
const HOST = 'localhost';

const app = createApp(db, { logger: false });

app.listen(PORT, () => {
    console.log(chalk.bold(`\nJSON Server يعمل على http://${HOST}:${PORT}\n`));
    const keys = Object.keys(db.data);
    if (keys.length > 0) {
        console.log(chalk.bold('Endpoints:'));
        keys.forEach((key) => {
            console.log(chalk.gray(`  http://${HOST}:${PORT}/`) + chalk.blue(key));
        });
    }
    console.log();
});
