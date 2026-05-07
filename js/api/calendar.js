import { getToken } from '../auth.js';

const BASE = 'https://www.googleapis.com/calendar/v3';

async function req(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error('Non authentifié');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar API ${res.status}: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export async function listCalendars() {
  const data = await req('/users/me/calendarList');
  return data.items || [];
}

export async function createEvent(calendarId, session, mission, organisme, entreprise) {
  const event = buildEvent(session, mission, organisme, entreprise);
  return req(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export async function updateEvent(calendarId, eventId, session, mission, organisme, entreprise) {
  const event = buildEvent(session, mission, organisme, entreprise);
  return req(`/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(event),
  });
}

export async function deleteEvent(calendarId, eventId) {
  const token = getToken();
  await fetch(`${BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

function buildEvent(session, mission, organisme, entreprise) {
  const orgNom = organisme?.nom || 'Organisme inconnu';
  const entNom = entreprise?.nom || 'Entreprise inconnue';
  const titre = mission.intitule || 'Formation';

  const startDt = session.date;
  const endDate = new Date(session.date);
  endDate.setDate(endDate.getDate() + 1);
  const endDt = endDate.toISOString().split('T')[0];

  return {
    summary: `${titre} - ${entNom} - ${orgNom}`,
    start: { date: startDt },
    end: { date: endDt },
    colorId: '6',
  };
}
