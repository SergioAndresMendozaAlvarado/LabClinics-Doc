import { fetchActiveDoctors } from './db.js';
import {
  renderDoctorCards,
  updateListStatus,
  updateEmptyState,
  populateSelectOptions,
} from './render.js';
import { uniqueSorted } from './utils.js';
import { setupSiteHeader } from './site.js';

setupSiteHeader();

const cardsContainer = document.getElementById('cards');
const statusContainer = document.getElementById('list-status');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('q');
const specialtySelect = document.getElementById('specialty');
const branchSelect = document.getElementById('branch');

let allDoctors = [];

const normalize = (value = '') => value.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const buildSearchIndex = (doctor) => {
  const parts = [
    doctor.fullName,
    doctor.profession,
    doctor.branch,
    doctor.address,
    ...(doctor.specialties || []),
    ...(doctor.treatments || []),
  ].filter(Boolean);
  return normalize(parts.join(' '));
};

const doctorMatchesFilters = (doctor, filters) => {
  if (filters.specialty && !(doctor.specialties || []).some((item) => item === filters.specialty)) {
    return false;
  }
  if (filters.branch && normalize(doctor.branch) !== normalize(filters.branch)) {
    return false;
  }
  if (filters.query) {
    return buildSearchIndex(doctor).includes(filters.query);
  }
  return true;
};

const applyFilters = () => {
  const filters = {
    query: normalize(searchInput?.value || '').trim(),
    specialty: specialtySelect?.value || '',
    branch: branchSelect?.value || '',
  };

  const filtered = allDoctors.filter((doctor) => doctorMatchesFilters(doctor, filters));

  renderDoctorCards(cardsContainer, filtered);
  updateListStatus(statusContainer, {
    filtered: filtered.length,
    total: allDoctors.length,
    query: searchInput?.value || '',
  });
  updateEmptyState(emptyState, filtered.length === 0);
};

const populateFilters = () => {
  const specialtiesSet = uniqueSorted(allDoctors.flatMap((doctor) => doctor.specialties?.length
    ? doctor.specialties
    : doctor.specialty
      ? [doctor.specialty]
      : []));

  const branchesSet = uniqueSorted(allDoctors.map((doctor) => doctor.branch).filter(Boolean));

  populateSelectOptions(specialtySelect, [
    { value: '', label: 'Todas' },
    ...specialtiesSet.map((value) => ({ value, label: value })),
  ]);

  populateSelectOptions(branchSelect, [
    { value: '', label: 'Todas' },
    ...branchesSet.map((value) => ({ value, label: value })),
  ]);
};

const attachListeners = () => {
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (specialtySelect) specialtySelect.addEventListener('change', applyFilters);
  if (branchSelect) branchSelect.addEventListener('change', applyFilters);
};

const init = async () => {
  try {
    updateListStatus(statusContainer, { filtered: 0, total: 0 });
    const doctors = await fetchActiveDoctors();
    allDoctors = doctors
      .sort((a, b) => {
        const priorityDiff = (b.priority || 0) - (a.priority || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return a.fullName.localeCompare(b.fullName, 'es', { sensitivity: 'base' });
      })
      .map((doctor) => ({
        ...doctor,
        specialties: doctor.specialties?.length ? doctor.specialties : (doctor.specialty ? [doctor.specialty] : []),
      }));

    populateFilters();
    attachListeners();
    applyFilters();
  } catch (error) {
    console.error('Error al cargar profesionales', error);
    if (statusContainer) {
      statusContainer.textContent = 'Ocurrió un error al cargar la información. Intenta recargar la página.';
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
