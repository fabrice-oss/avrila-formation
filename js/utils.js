export function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function isoToday() {
  return new Date().toISOString().split('T')[0];
}

export function addDays(iso, n) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function formatCurrency(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);
}

export function formatDateLong(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function sortByDate(arr, key = 'date', desc = true) {
  return [...arr].sort((a, b) => desc
    ? new Date(b[key]) - new Date(a[key])
    : new Date(a[key]) - new Date(b[key]));
}

export function nextInvoiceNumber(factures, prefix = 'AF') {
  const year = new Date().getFullYear();
  const nums = factures
    .map(f => f.numero)
    .filter(n => n?.startsWith(`${prefix}-${year}-`))
    .map(n => parseInt(n.split('-')[2]) || 0);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${year}-${String(next).padStart(3, '0')}`;
}

export function missionTotalHT(mission) {
  const joursTotal = (mission.sessions || []).length;
  const base = joursTotal * (mission.tarif_journalier || 0);
  return base + (mission.frais_deplacement || 0);
}

export function missionHeuresFormateur(mission) {
  return (mission.sessions || []).reduce((sum, s) => sum + (s.heures || 0), 0);
}

export function missionHeuresStagiaires(mission) {
  return missionHeuresFormateur(mission) * (mission.participants || 0);
}

export function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

export function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
}

export function toast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  container.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}

export function confirm(message) {
  return new Promise(resolve => {
    const overlay = document.getElementById('confirm-overlay');
    const msg = document.getElementById('confirm-message');
    const btnOk = document.getElementById('confirm-ok');
    const btnCancel = document.getElementById('confirm-cancel');
    msg.textContent = message;
    overlay.classList.remove('hidden');
    const cleanup = () => overlay.classList.add('hidden');
    btnOk.onclick = () => { cleanup(); resolve(true); };
    btnCancel.onclick = () => { cleanup(); resolve(false); };
  });
}
