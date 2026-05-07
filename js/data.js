import { loadJSON, saveJSON, initDriveFolder } from './api/drive.js';
import { CONFIG } from './config.js';
import { toast } from './utils.js';

export const store = {
  settings: { ...CONFIG.ORGANISME, facturation: { ...CONFIG.FACTURATION }, calendar_id: CONFIG.CALENDAR_ID },
  organismes: [],
  entreprises: [],
  missions: [],
  factures: [],
  _loaded: false,
};

export async function initData() {
  await initDriveFolder(CONFIG.DRIVE_FOLDER_NAME);

  const [settings, organismes, entreprises, missions, factures] = await Promise.all([
    loadJSON('settings'),
    loadJSON('organismes'),
    loadJSON('entreprises'),
    loadJSON('missions'),
    loadJSON('factures'),
  ]);

  if (settings) store.settings = { ...store.settings, ...settings };
  if (organismes) store.organismes = organismes;
  if (entreprises) store.entreprises = entreprises;
  if (missions) store.missions = missions;
  if (factures) store.factures = factures;

  store._loaded = true;
}

export async function saveSettings() {
  await saveJSON('settings', store.settings);
}

export async function saveOrganismes() {
  await saveJSON('organismes', store.organismes);
}

export async function saveEntreprises() {
  await saveJSON('entreprises', store.entreprises);
}

export async function saveMissions() {
  await saveJSON('missions', store.missions);
}

export async function saveFactures() {
  await saveJSON('factures', store.factures);
}

export async function autosave(key) {
  try {
    await saveJSON(key, store[key]);
  } catch (e) {
    toast('Erreur de sauvegarde Drive', 'error');
    console.error(e);
  }
}

export function getOrganisme(id) {
  return store.organismes.find(o => o.id === id);
}

export function getEntreprise(id) {
  return store.entreprises.find(e => e.id === id);
}

export function getMission(id) {
  return store.missions.find(m => m.id === id);
}

export function getFacture(id) {
  return store.factures.find(f => f.id === id);
}

export function getMissionFacture(missionId) {
  return store.factures.find(f => f.mission_id === missionId);
}

export function bpfStats(year) {
  const y = parseInt(year);
  const missions = store.missions.filter(m => {
    return (m.sessions || []).some(s => new Date(s.date).getFullYear() === y);
  });
  const factures = store.factures.filter(f => {
    const m = getMission(f.mission_id);
    return m && (m.sessions || []).some(s => new Date(s.date).getFullYear() === y);
  });

  const totalCA = factures.reduce((sum, f) => sum + (f.montant_ht || 0), 0);
  const heuresFormateur = missions.reduce((sum, m) => {
    return sum + (m.sessions || []).filter(s => new Date(s.date).getFullYear() === y)
      .reduce((h, s) => h + (s.heures || 0), 0);
  }, 0);
  const totalStagiaires = missions.reduce((sum, m) => sum + (m.participants || 0), 0);
  const heuresStagiaires = missions.reduce((sum, m) => {
    const h = (m.sessions || []).filter(s => new Date(s.date).getFullYear() === y)
      .reduce((hh, s) => hh + (s.heures || 0), 0);
    return sum + h * (m.participants || 0);
  }, 0);
  const distanciel = missions.some(m => m.distanciel);

  return { totalCA, heuresFormateur, totalStagiaires, heuresStagiaires, distanciel, missions, factures };
}
