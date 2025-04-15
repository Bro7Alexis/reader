import { app, BrowserWindow, ipcMain } from 'electron';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;
let nestProcess;

function createWindow() {
  // Créer la fenêtre du navigateur
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Chargement d'une page simple pour interagir avec le serveur NestJS
  const indexPath = join(__dirname, 'index.html');
  console.log('Chemin vers index.html:', indexPath);

  // Vérifier si le fichier existe
  if (existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    console.error('Fichier index.html introuvable:', indexPath);
    mainWindow.loadURL(
      'data:text/html,<h1>Erreur: fichier index.html non trouvé</h1>',
    );
  }

  // Ouvrir les DevTools en mode développement
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startNestServer() {
  // Lancer le serveur NestJS en tant que processus enfant
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const nestPath = join(__dirname, '../dist/src/main.js');
  console.log('Starting NestJS server from:', nestPath);

  // Vérifier si le fichier existe
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  if (existsSync(nestPath)) {
    console.error('Fichier main.js de NestJS introuvable:', nestPath);
    return;
  }

  nestProcess = spawn('node', [nestPath], {
    stdio: 'pipe',
  });

  nestProcess.stdout.on('data', (data) => {
    console.log(`NestJS: ${data}`);
  });

  nestProcess.stderr.on('data', (data) => {
    console.error(`NestJS Error: ${data}`);
  });

  nestProcess.on('close', (code) => {
    console.log(`NestJS process exited with code ${code}`);
  });
}

app.on('ready', () => {
  try {
    startNestServer();
    createWindow();
  } catch (error) {
    console.error('Erreur lors du démarrage:', error);
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  // Tuer le processus NestJS lorsque l'application est fermée
  if (nestProcess) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    nestProcess.kill();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// Communication IPC entre l'interface Electron et le processus principal
ipcMain.on('message-to-main', (event, arg) => {
  console.log('Message reçu dans le processus principal:', arg);
  event.reply('message-from-main', 'Message du processus principal');
});
