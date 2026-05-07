import { initAuth, setupGoogleAuth, signIn, signOut, isAuthenticated } from './auth.js';
import { initData } from './data.js';

const views = {
  dashboard: () => import('./views/dashboard.js'),
  missions: () => import('./views/missions.js'),
  organismes: () => import('./views/organismes.js'),
  entreprises: () => import('./views/entreprises.js'),
  factures: () => import('./views/factures.js'),
  bpf: () => import('./views/bpf.js'),
  parametres: () => import('./views/parametres.js'),
};

const sectionTitles = {
  dashboard: 'Tableau de bord',
  missions: 'Missions',
  organismes: 'Organismes de formation',
  entreprises: 'Entreprises formées',
  factures: 'Factures',
  bpf: 'Bilan Pédagogique et Financier',
  parametres: 'Paramètres',
};

let currentSection = 'dashboard';
let navParams = {};

export async function navigate(section, params = {}) {
  if (!views[section]) return;
  currentSection = section;
  navParams = params;

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.section === section);
  });

  document.getElementById('section-title').textContent = sectionTitles[section] || section;

  const content = document.getElementById('content-area');
  content.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const mod = await views[section]();
    content.innerHTML = mod.render(params);
    mod.init?.(params);
  } catch (e) {
    content.innerHTML = `<div class="error-state">Erreur de chargement : ${e.message}</div>`;
    console.error(e);
  }
}

export function showModal(title, body, extraClass = '') {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = body;
  const modal = document.getElementById('modal');
  modal.className = `modal glass-card ${extraClass}`;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

export function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

async function onAuthChange(authenticated) {
  if (authenticated) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('loading-overlay').classList.remove('hidden');
    try {
      await initData();
      document.getElementById('loading-overlay').classList.add('hidden');
      navigate('dashboard');
    } catch (e) {
      document.getElementById('loading-overlay').classList.add('hidden');
      console.error('Init error:', e);
    }
  } else {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  }
}

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      navigate(item.dataset.section);
    });
  });

  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
  document.getElementById('modal-close')?.addEventListener('click', closeModal);

  document.getElementById('signout-btn')?.addEventListener('click', () => {
    signOut();
  });

  document.getElementById('google-signin-btn')?.addEventListener('click', () => {
    signIn();
  });
}

async function main() {
  initNavigation();
  initAuth(onAuthChange);
  await setupGoogleAuth();
}

main();
