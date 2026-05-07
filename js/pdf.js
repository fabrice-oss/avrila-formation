import { store } from './data.js';
import { formatDate, formatCurrency, formatDateLong } from './utils.js';

let logoDataUrl = null;

async function getLogoDataUrl() {
  if (logoDataUrl) return logoDataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      logoDataUrl = canvas.toDataURL('image/png');
      resolve(logoDataUrl);
    };
    img.onerror = () => resolve(null);
    img.src = 'assets/logo.png';
  });
}

export async function generateInvoicePDF(facture, mission) {
  const s = store.settings;
  const org = store.organismes.find(o => o.id === mission.organisme_id) || {};
  const ent = store.entreprises.find(e => e.id === mission.entreprise_id) || {};
  const logo = await getLogoDataUrl();

  const navy = '#1B3A8C';
  const orange = '#F5A623';
  const lightGrey = '#F8F9FC';
  const darkText = '#1A2340';

  const lignes = buildLignes(facture, mission);
  const totalHT = lignes.reduce((sum, l) => sum + l.total, 0);

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [45, 45, 45, 60],
    defaultStyle: { font: 'Roboto', fontSize: 10, color: darkText },

    footer: (currentPage, pageCount) => ({
      columns: [
        {
          text: `${s.nom_commercial || 'AVRILA FORMATION'} — SIRET ${s.siret} — NDA ${s.nda} — NAF ${s.naf}`,
          alignment: 'center', fontSize: 8, color: '#888', margin: [45, 0, 45, 0],
        },
      ],
    }),

    content: [
      // Header row
      {
        columns: [
          logo
            ? { image: logo, width: 80, margin: [0, 0, 0, 0] }
            : { text: s.nom_commercial || 'AVRILA FORMATION', fontSize: 20, bold: true, color: navy },
          {
            stack: [
              { text: 'FACTURE', fontSize: 26, bold: true, color: navy, alignment: 'right' },
              { text: `N° ${facture.numero}`, fontSize: 13, color: orange, alignment: 'right', margin: [0, 2, 0, 0] },
              { text: `Date : ${formatDate(facture.date_emission)}`, fontSize: 10, alignment: 'right', margin: [0, 4, 0, 0] },
              { text: `Échéance : ${formatDate(facture.date_echeance)}`, fontSize: 10, color: '#c0392b', bold: true, alignment: 'right' },
            ],
          },
        ],
        margin: [0, 0, 0, 25],
      },

      // Separator
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 505, y2: 0, lineWidth: 3, lineColor: orange }], margin: [0, 0, 0, 20] },

      // Emetteur / Client
      {
        columns: [
          {
            stack: [
              { text: 'DE', fontSize: 8, bold: true, color: '#999', margin: [0, 0, 0, 4] },
              { text: s.nom_commercial || 'AVRILA FORMATION', bold: true, fontSize: 12, color: navy },
              { text: `${s.dirigeant}` },
              { text: s.adresse },
              { text: `${s.cp} ${s.ville}` },
              { text: `Tél : ${s.tel}`, margin: [0, 4, 0, 0] },
              { text: `Email : ${s.email}` },
              { text: `SIRET : ${s.siret}`, margin: [0, 4, 0, 0] },
              { text: `Code NAF : ${s.naf}` },
              { text: `N° Déclaration d'activité : ${s.nda}` },
            ],
            width: '48%',
          },
          { width: '4%', text: '' },
          {
            stack: [
              { text: 'FACTURÉ À', fontSize: 8, bold: true, color: '#999', margin: [0, 0, 0, 4] },
              { text: org.nom || '', bold: true, fontSize: 12, color: navy },
              org.adresse ? { text: org.adresse } : {},
              (org.cp || org.ville) ? { text: `${org.cp || ''} ${org.ville || ''}`.trim() } : {},
              org.siret ? { text: `SIRET : ${org.siret}`, margin: [0, 4, 0, 0] } : {},
              org.correspondant ? { text: `Contact : ${org.correspondant}`, margin: [0, 4, 0, 0] } : {},
              org.email ? { text: `Email : ${org.email}` } : {},
            ],
            fillColor: lightGrey,
            margin: [12, 0, 0, 0],
            width: '48%',
          },
        ],
        margin: [0, 0, 0, 25],
      },

      // Objet
      {
        table: {
          widths: ['*'],
          body: [[{
            text: `OBJET : ${mission.intitule || 'Formation'} — ${ent.nom || ''}`,
            bold: true, color: navy, fillColor: lightGrey,
            margin: [10, 8, 10, 8],
          }]],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 20],
      },

      // Détail sessions
      buildSessionsTable(mission, navy, orange, lightGrey),

      // Lignes de facturation
      buildLignesTable(lignes, navy, orange, lightGrey, totalHT, s),

      // Mentions légales
      {
        stack: [
          { text: s.facturation?.mention_tva || 'TVA non applicable, art. 293 B du CGI', italic: true, color: '#666', fontSize: 9, margin: [0, 4, 0, 2] },
          { text: `Pénalités de retard : ${s.facturation?.penalites_taux || 'taux directeur BCE + 10 points'} — Indemnité forfaitaire de recouvrement : ${s.facturation?.indemnite_recouvrement || 40} €`, fontSize: 8, color: '#888' },
        ],
        margin: [0, 16, 0, 16],
      },

      // RIB
      buildRIB(s, navy, lightGrey),
    ],
  };

  return new Promise((resolve) => {
    pdfMake.createPdf(docDefinition).getBlob(resolve);
  });
}

function buildLignes(facture, mission) {
  const lignes = [];
  const sessions = mission.sessions || [];
  const nb = sessions.length;
  const tarif = mission.tarif_journalier || 0;
  if (nb > 0 && tarif > 0) {
    lignes.push({
      description: `Animation formation : ${mission.intitule || 'Formation'}`,
      quantite: nb,
      unite: nb > 1 ? 'jours' : 'jour',
      prix_unitaire: tarif,
      total: nb * tarif,
    });
  }
  if (mission.frais_deplacement > 0) {
    lignes.push({
      description: 'Frais de déplacement',
      quantite: 1,
      unite: 'forfait',
      prix_unitaire: mission.frais_deplacement,
      total: mission.frais_deplacement,
    });
  }
  return lignes;
}

function buildSessionsTable(mission, navy, orange, lightGrey) {
  const sessions = mission.sessions || [];
  if (!sessions.length) return {};
  const rows = sessions.map(s => [
    { text: formatDate(s.date), alignment: 'center' },
    { text: `${s.heures}h`, alignment: 'center' },
  ]);
  return {
    stack: [
      { text: 'DÉTAIL DES SESSIONS', bold: true, color: navy, fontSize: 9, margin: [0, 0, 0, 6] },
      {
        table: {
          widths: ['*', 80],
          body: [
            [
              { text: 'Date', bold: true, fillColor: navy, color: 'white', alignment: 'center', margin: [0, 4, 0, 4] },
              { text: 'Durée', bold: true, fillColor: navy, color: 'white', alignment: 'center', margin: [0, 4, 0, 4] },
            ],
            ...rows.map((r, i) => r.map(cell => ({ ...cell, fillColor: i % 2 === 0 ? lightGrey : 'white' }))),
          ],
        },
        layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#E0E4EF', vLineColor: () => '#E0E4EF' },
      },
    ],
    margin: [0, 0, 0, 20],
  };
}

function buildLignesTable(lignes, navy, orange, lightGrey, totalHT, s) {
  const rows = lignes.map((l, i) => [
    { text: l.description, fillColor: i % 2 === 0 ? lightGrey : 'white' },
    { text: String(l.quantite), alignment: 'center', fillColor: i % 2 === 0 ? lightGrey : 'white' },
    { text: l.unite, alignment: 'center', fillColor: i % 2 === 0 ? lightGrey : 'white' },
    { text: formatCurrency(l.prix_unitaire), alignment: 'right', fillColor: i % 2 === 0 ? lightGrey : 'white' },
    { text: formatCurrency(l.total), alignment: 'right', bold: true, fillColor: i % 2 === 0 ? lightGrey : 'white' },
  ]);

  return {
    table: {
      widths: ['*', 50, 60, 90, 90],
      body: [
        [
          { text: 'Désignation', bold: true, fillColor: navy, color: 'white', margin: [4, 6, 4, 6] },
          { text: 'Qté', bold: true, fillColor: navy, color: 'white', alignment: 'center', margin: [4, 6, 4, 6] },
          { text: 'Unité', bold: true, fillColor: navy, color: 'white', alignment: 'center', margin: [4, 6, 4, 6] },
          { text: 'P.U. HT', bold: true, fillColor: navy, color: 'white', alignment: 'right', margin: [4, 6, 4, 6] },
          { text: 'Total HT', bold: true, fillColor: navy, color: 'white', alignment: 'right', margin: [4, 6, 4, 6] },
        ],
        ...rows,
        [
          { text: '', border: [false, false, false, false] },
          { text: '', border: [false, false, false, false] },
          { text: '', border: [false, false, false, false] },
          { text: 'TOTAL HT', bold: true, alignment: 'right', fillColor: orange, color: 'white', margin: [4, 8, 4, 8] },
          { text: formatCurrency(totalHT), bold: true, fontSize: 12, alignment: 'right', fillColor: navy, color: 'white', margin: [4, 8, 4, 8] },
        ],
      ],
    },
    layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#E0E4EF', vLineColor: () => '#E0E4EF' },
    margin: [0, 0, 0, 10],
  };
}

function buildRIB(s, navy, lightGrey) {
  if (!s.iban) return {};
  return {
    table: {
      widths: ['*'],
      body: [[{
        stack: [
          { text: 'COORDONNÉES BANCAIRES', bold: true, color: navy, fontSize: 9, margin: [0, 0, 0, 6] },
          s.banque ? { text: `Banque : ${s.banque}` } : {},
          { text: `IBAN : ${s.iban}` },
          s.bic ? { text: `BIC : ${s.bic}` } : {},
        ],
        fillColor: lightGrey,
        margin: [12, 10, 12, 10],
      }]],
    },
    layout: 'noBorders',
  };
}
