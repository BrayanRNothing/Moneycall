/**
 * Script para tomar capturas de pantalla reales del CRM Moneycall
 * Uso: node take_screenshots.cjs <usuario> <contraseña>
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://localhost:5173';
const USUARIO = process.argv[2] || '';
const PASSWORD = process.argv[3] || '';

const OUTPUT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const PAGES = [
  { name: '01_login',       url: `${BASE_URL}/`,            waitFor: 2000, selector: 'form' },
  { name: '02_dashboard',   url: `${BASE_URL}/vendedor`,    waitFor: 4000 },
  { name: '03_seguimiento', url: `${BASE_URL}/vendedor/seguimiento`, waitFor: 4000 },
  { name: '04_clientes',    url: `${BASE_URL}/vendedor/clientes`,    waitFor: 4000 },
  { name: '05_calendario',  url: `${BASE_URL}/vendedor/calendario`,  waitFor: 4000 },
  { name: '06_equipo',      url: `${BASE_URL}/vendedor/equipo`,      waitFor: 4000 },
  { name: '07_ajustes',     url: `${BASE_URL}/vendedor/ajustes`,     waitFor: 3000 },
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('🚀 Iniciando Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--allow-insecure-localhost',
      '--disable-web-security',
      '--window-size=1440,900',
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.setBypassCSP(true);
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'es-MX' });
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // ─── LOGIN ───────────────────────────────────────────────────────────
  console.log('🔐 Navegando al login...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_login.png'), fullPage: false });
  console.log('✅ Captura: 01_login.png');

  if (USUARIO && PASSWORD) {
    console.log(`🔑 Iniciando sesión como: ${USUARIO}`);
    // Rellenar usuario
    await page.type('input[placeholder="Usuario"]', USUARIO, { delay: 60 });
    await sleep(300);
    // Rellenar contraseña
    await page.type('input[placeholder="••••••••"]', PASSWORD, { delay: 60 });
    await sleep(300);
    // Hacer click en botón de ingresar
    await page.click('button[type="submit"]');
    console.log('⏳ Esperando redirección...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
    await sleep(4000);

    // ─── DASHBOARD ───────────────────────────────────────────────────────
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02_dashboard.png'), fullPage: false });
    console.log('✅ Captura: 02_dashboard.png');

    // ─── SEGUIMIENTO (prospectos) ─────────────────────────────────────────
    await page.goto(`${BASE_URL}/vendedor/prospectos`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(4000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_seguimiento.png'), fullPage: false });
    console.log('✅ Captura: 03_seguimiento.png');

    // ─── CLIENTES ────────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/vendedor/clientes`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(4000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_clientes.png'), fullPage: false });
    console.log('✅ Captura: 04_clientes.png');

    // ─── CALENDARIO ──────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/vendedor/calendario`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(4000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05_calendario.png'), fullPage: false });
    console.log('✅ Captura: 05_calendario.png');

    // ─── EQUIPO ──────────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/vendedor/equipo`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(4000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06_equipo.png'), fullPage: false });
    console.log('✅ Captura: 06_equipo.png');

    // ─── MANUAL METODOLOGÍA ──────────────────────────────────────────────
    await page.goto(`${BASE_URL}/vendedor/manual`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(3000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '07_manual.png'), fullPage: false });
    console.log('✅ Captura: 07_manual.png');

    // ─── AJUSTES ─────────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/vendedor/ajustes`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(3000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08_ajustes.png'), fullPage: false });
    console.log('✅ Captura: 08_ajustes.png');

  } else {
    console.log('⚠️  No se proporcionaron credenciales. Solo se capturó el login.');
    console.log('   Uso: node take_screenshots.cjs <usuario> <contraseña>');
  }

  await browser.close();
  console.log(`\n🎉 Listo! Capturas guardadas en: ${OUTPUT_DIR}`);
})();
