// --- CONSTANTES ---

export const WEEKLY_SCHEDULE = [
  { id: 'mon-19', day: 'Lunes', time: '19:00', type: 'Ballet Fit', spots: 10, teacher: 'Jenny', dayIdx: 1 },
  { id: 'wed-19', day: 'Miércoles', time: '19:00', type: 'Ballet Fit', spots: 10, teacher: 'Jenny', dayIdx: 3 },
  { id: 'fri-19', day: 'Viernes', time: '19:00', type: 'Ballet Fit', spots: 10, teacher: 'Lucy', dayIdx: 5 },
  { id: 'sat-09', day: 'Sábado', time: '09:00', type: 'Ballet Fit', spots: 10, teacher: 'Jenny', dayIdx: 6 },
];

export const MOTIVATIONAL_QUOTES = [
  "¡Qué gusto verte de nuevo!", "¡Lista para brillar en el estudio!",
  "Tu disciplina es tu mayor fuerza.", "Un día más cerca de tus objetivos.",
  "¡A darle con todo hoy!", "La elegancia se entrena con cada paso."
];

// --- FUNCIONES UTILITARIAS ---

export const getHoursUntilClass = (dayIdx, timeStr) => {
  const now = new Date();
  const classTime = new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);
  let daysToAdd = (dayIdx - now.getDay() + 7) % 7;
  
  // Ajuste para ventana de 2 horas
  if (daysToAdd === 0) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const classMinutesTotal = hours * 60 + minutes;
    if (nowMinutes > classMinutesTotal + 120) {
       daysToAdd = 7;
    }
  }
  classTime.setDate(now.getDate() + daysToAdd);
  classTime.setHours(hours, minutes, 0, 0);
  const diffMs = classTime - now;
  return diffMs / (1000 * 60 * 60);
};

export const isClassInPast = (dayIdx, timeStr) => {
  const now = new Date();
  const currentDay = now.getDay(); 
  const [hours, minutes] = timeStr.split(':').map(Number);
  const currentTimeInMin = now.getHours() * 60 + now.getMinutes();
  const classTimeInMin = hours * 60 + minutes;

  if (currentDay > dayIdx) return true;
  if (currentDay === dayIdx && currentTimeInMin >= classTimeInMin) return true;
  return false;
};

export const getNextClassFromSchedule = (teacherName = null) => {
  let schedule = WEEKLY_SCHEDULE;
  if (teacherName) {
    schedule = WEEKLY_SCHEDULE.filter(s => s.teacher === teacherName);
  }
  const diffs = schedule.map(s => ({
    ...s,
    diff: getHoursUntilClass(s.dayIdx, s.time)
  }));
  return diffs.sort((a, b) => a.diff - b.diff)[0];
};

export const getCurrentMonthName = () => {
  return new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date()).toUpperCase();
};