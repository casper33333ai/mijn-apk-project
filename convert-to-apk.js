/**
 * APK FORGE - CI OPTIMIZED ENGINE
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const log = (msg) => console.log(`[32m[FORGE][0m ${msg}`);
const error = (msg) => { console.error(`[31m[FOUT][0m ${msg}`); process.exit(1); };

async function startForge() {
  log('🚀 Starten van build proces voor: https://www.google.nl');

  try {
    // 1. Web Assets voorbereiden (Capacitor eis)
    if (!fs.existsSync('www')) fs.mkdirSync('www', { recursive: true });
    fs.writeFileSync(path.join('www', 'index.html'), '<!DOCTYPE html><html><body><script>window.location.href="https://www.google.nl"</script></body></html>');

    // 2. Capacitor Initialisatie
    log('⚙️ Capacitor configureren...');
    const capConfig = {
      appId: "com.forge.myapp",
      appName: "MijnNativeApp",
      webDir: "www",
      server: { url: "https://www.google.nl", cleartext: true },
      android: { allowMixedContent: true }
    };
    fs.writeFileSync('capacitor.config.json', JSON.stringify(capConfig, null, 2));

    // 3. Android Platform Management
    if (!fs.existsSync('android')) {
      log('🤖 Android platform toevoegen...');
      execSync('npx cap add android', { stdio: 'inherit' });
    }

    // 4. Icoon injectie
    if (fs.existsSync('app-icon.png')) {
      log('🎨 Icoon installeren...');
      const resPath = 'android/app/src/main/res';
      const mipmapFolders = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
      mipmapFolders.forEach(folder => {
        const targetDir = path.join(resPath, folder);
        if (fs.existsSync(targetDir)) {
          ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'].forEach(f => {
            try { fs.copyFileSync('app-icon.png', path.join(targetDir, f)); } catch(e) {}
          });
        }
      });
    }

    // 5. Synchroniseren en Bouwen
    log('🔄 Syncing...');
    execSync('npx cap sync android', { stdio: 'inherit' });

    log('🏗️ Gradle Assemble...');
    const androidDir = path.join(process.cwd(), 'android');
    if (process.platform !== 'win32') execSync('chmod +x gradlew', { cwd: androidDir });

    const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    execSync(`${gradleCmd} assembleDebug --no-daemon`, { 
      cwd: androidDir,
      stdio: 'inherit',
      env: { ...process.env, JAVA_HOME: process.env.JAVA_HOME_17_X64 }
    });

    log('✅ APK FORGE VOLTOOID!');
  } catch (err) {
    error('Fout tijdens build: ' + err.message);
  }
}

startForge();