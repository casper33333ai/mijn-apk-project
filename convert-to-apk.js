/**
 * APK FORGE - ROBUST BUILD ENGINE
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const log = (msg) => console.log(`[32m[FORGE][0m ${msg}`);
const warn = (msg) => console.log(`[33m[WAARSCHUWING][0m ${msg}`);
const error = (msg) => { console.error(`[31m[FOUT][0m ${msg}`); process.exit(1); };

async function startForge() {
  log('🚀 Starten van de transformatie voor: https://www.google.nl');

  try {
    // 1. Setup Project Structure
    if (!fs.existsSync('package.json')) {
      log('📦 Initialiseren package.json...');
      fs.writeFileSync('package.json', JSON.stringify({ name: "apk-forge-project", version: "1.0.0" }, null, 2));
    }

    log('📥 Installeren van Capacitor Core & CLI...');
    execSync('npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/app @capacitor/status-bar', { stdio: 'inherit' });

    if (!fs.existsSync('www')) {
      log('📁 Aanmaken web directory...');
      fs.mkdirSync('www', { recursive: true });
    }
    // Capacitor heeft een index.html nodig om te kunnen synchroniseren
    fs.writeFileSync(path.join('www', 'index.html'), '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background:#000"></body></html>');

    // 2. Capacitor Config
    log('⚙️ Configureren Capacitor...');
    const capConfig = {
      appId: "com.forge.myapp",
      appName: "MijnNativeApp",
      webDir: "www",
      server: { url: "https://www.google.nl", cleartext: true }
    };
    fs.writeFileSync('capacitor.config.json', JSON.stringify(capConfig, null, 2));

    // 3. Android Platform Management
    if (!fs.existsSync('android')) {
      log('🤖 Android platform toevoegen...');
      execSync('npx cap add android', { stdio: 'inherit' });
    } else {
      warn('🤖 Android map bestaat al, overslaan add...');
    }

    // 4. Icon Injection
    if (fs.existsSync('app-icon.png')) {
      log('🎨 Custom icoon installeren...');
      const resPath = 'android/app/src/main/res';
      const mipmapFolders = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];

      mipmapFolders.forEach(folder => {
        const targetDir = path.join(resPath, folder);
        if (fs.existsSync(targetDir)) {
          ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'].forEach(file => {
             try { fs.copyFileSync('app-icon.png', path.join(targetDir, file)); } catch(e) {}
          });
        }
      });
    }

    // 5. Sync & Build
    log('🔄 Capacitor Sync...');
    execSync('npx cap sync android', { stdio: 'inherit' });

    log('🏗️ Gradle Build starten...');
    const androidDir = path.join(process.cwd(), 'android');
    
    // Zorg voor executable rechten op gradlew
    if (process.platform !== 'win32') {
      execSync('chmod +x gradlew', { cwd: androidDir });
    }

    const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    
    // Voer build uit met extra memory en gradle flags voor CI
    execSync(`${gradleCmd} assembleDebug --no-daemon`, { 
      cwd: androidDir,
      stdio: 'inherit',
      env: { 
        ...process.env, 
        JAVA_HOME: process.env.JAVA_HOME_17_X64 || process.env.JAVA_HOME 
      }
    });

    log('✅ APK FORGE SUCCES!');
  } catch (err) {
    error('Build proces mislukt bij stap: ' + err.message);
  }
}

startForge();