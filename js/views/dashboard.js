import { store, getOrganisme, getEntreprise } from '../data.js';
import { formatCurrency, formatDate } from '../utils.js';
import { navigate } from '../app.js';

export function render() {
  const now = new Date();
  const year = now.getFullYear();

  const facturesEnAttente = store.factures.filter(f => f.statut === 'en_attente');
  const facturesPayees = store.factures.filter(f => f.statut === 'payee' && new Date(f.date_paiement || '').getFullYear() === year);
  const missionsEnCours = store.missions.filter(m => m.statut !== 'terminee' && m.statut !== 'annulee');
  const caEnAttente = facturesEnAttente.reduce((s, f) => s + (f.montant_ht || 0), 0);
  const caPercu = facturesPayees.reduce((s, f) => s + (f.montant_ht || 0), 0);

  const upcomingSessions = [];
  const todayStr = now.toISOString().split('T')[0];
  store.missions.forEach(m => {
    if (m.statut === 'annulee') return;
    (m.sessions || []).forEach(s => {
      if (s.date >= todayStr) upcomingSessions.push({ ...s, mission: m });
    });
  });
  upcomingSessions.sort((a, b) => a.date.localeCompare(b.date));
  const next5 = upcomingSessions.slice(0, 5);

  const recentFactures = [...store.factures]
    .sort((a, b) => b.date_emission.localeCompare(a.date_emission))
    .slice(0, 5);

  return `
    <div class="dashboard">
      <div class="stats-grid">
        <div class="stat-card glass-card">
          <div class="stat-icon" style="background: linear-gradient(135deg,#1B3A8C,#2d5fce)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">CA perçu ${year}</div>
            <div class="stat-value">${formatCurrency(caPercu)}</div>
          </div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-icon" style="background: linear-gradient(135deg,#e67e22,#F5A623)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">En attente de paiement</div>
            <div class="stat-value">${formatCurrency(caEnAttente)}</div>
            <div class="stat-sub">${facturesEnAttente.length} facture(s)</div>
          </div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-icon" style="background: linear-gradient(135deg,#27ae60,#2ecc71)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Missions en cours</div>
            <div class="stat-value">${missionsEnCours.length}</div>
          </div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-icon" style="background: linear-gradient(135deg,#8e44ad,#9b59b6)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Organismes partenaires</div>
            <div class="stat-value">${store.organismes.length}</div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="glass-card dashboard-panel">
          <div class="panel-header">
            <h3>Prochaines sessions</h3>
            <button class="btn-link" data-nav="missions">Voir tout →</button>
          </div>
          ${next5.length === 0 ? '<p class="empty-state">Aucune session à venir</p>' : `
          <div class="sessions-list">
            ${next5.map(s => {
              const org = getOrganisme(s.mission.organisme_id);
              const ent = getEntreprise(s.mission.entreprise_id);
              return `
                <div class="session-item">
                  <div class="session-date-badge">
                    <span class="date-day">${new Date(s.date).getDate()}</span>
                    <span class="date-month">${new Date(s.date).toLocaleDateString('fr-FR',{month:'short'})}</span>
                  </div>
                  <div class="session-info">
                    <div class="session-title">${s.mission.intitule || 'Formation'}</div>
                    <div class="session-sub">${ent?.nom || ''} · ${org?.nom || ''} · ${s.heures}h</div>
                  </div>
                </div>`;
            }).join('')}
          </div>`}
        </div>

        <div class="glass-card dashboard-panel">
          <div class="panel-header">
            <h3>Dernières factures</h3>
            <button class="btn-link" data-nav="factures">Voir tout →</button>
          </div>
          ${recentFactures.length === 0 ? '<p class="empty-state">Aucune facture</p>' : `
          <div class="factures-list">
            ${recentFactures.map(f => {
              const m = store.missions.find(m => m.id === f.mission_id);
              const org = m ? getOrganisme(m.organisme_id) : null;
              return `
                <div class="facture-item">
                  <div class="facture-numero">${f.numero}</div>
                  <div class="facture-info">
                    <div>${org?.nom || '—'}</div>
                    <div class="facture-date">${formatDate(f.date_emission)}</div>
                  </div>
                  <div class="facture-amount">${formatCurrency(f.montant_ht)}</div>
                  <span class="badge badge-${f.statut === 'payee' ? 'success' : 'warning'}">
                    ${f.statut === 'payee' ? 'Payée' : 'En attente'}
                  </span>
                </div>`;
            }).join('')}
          </div>`}
        </div>
      </div>
    </div>`;
}

export function init() {
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });
}
