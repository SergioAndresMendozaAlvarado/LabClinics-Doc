import { watchAuth, loginWithEmail, logout } from './auth.js';
import {
  watchDoctors,
  createDoctor,
  updateDoctor,
  removeDoctor,
} from './db.js';
import {
  renderDoctorTable,
  renderStateMessage,
} from './render.js';
import { formatFullName, parseTreatments, parseSpecialties } from './utils.js';

const splash = document.getElementById('splash');
const adminApp = document.getElementById('admin-app');
const loginView = document.getElementById('login-view');
const statusContainer = document.getElementById('admin-status');
const tableBody = document.getElementById('doctors-tbody');
const searchInput = document.getElementById('admin-search');
const filterSelect = document.getElementById('filter-active');
const createButton = document.getElementById('btn-create');
const logoutButton = document.getElementById('btn-logout');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const modal = document.getElementById('doctor-modal');
const doctorForm = document.getElementById('doctor-form');
const saveButton = document.getElementById('save-doctor');

const yearTarget = document.getElementById('year');
if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

let authUnsubscribe = null;
let doctorsUnsubscribe = null;
let doctorsCache = [];
let currentDoctor = null;
let searchDebounce = null;

const hideSplash = () => {
  if (!splash) return;
  splash.style.opacity = '0';
  splash.addEventListener('transitionend', () => {
    splash.style.display = 'none';
  }, { once: true });
};

const formElements = () => ({
  firstName: doctorForm.elements.firstName,
  lastName: doctorForm.elements.lastName,
  phone: doctorForm.elements.phone,
  profession: doctorForm.elements.profession,
  specialty: doctorForm.elements.specialty,
  address: doctorForm.elements.address,
  branch: doctorForm.elements.branch,
  email: doctorForm.elements.email,
  mapUrl: doctorForm.elements.mapUrl,
  about: doctorForm.elements.about,
  treatments: doctorForm.elements.treatments,
  socialX: doctorForm.elements['social-x'],
  socialFacebook: doctorForm.elements['social-facebook'],
  socialInstagram: doctorForm.elements['social-instagram'],
  socialTiktok: doctorForm.elements['social-tiktok'],
  photoName: doctorForm.elements.photoName,
  slug: doctorForm.elements.slug,
  priority: doctorForm.elements.priority,
  active: doctorForm.elements.active,
});

const resetDoctorForm = () => {
  doctorForm.reset();
  currentDoctor = null;
  const elements = formElements();
  elements.active.checked = true;
  doctorForm.querySelector('#modal-title').textContent = 'Nuevo profesional';
};

const fillDoctorForm = (doctor) => {
  const elements = formElements();
  elements.firstName.value = doctor.firstName || '';
  elements.lastName.value = doctor.lastName || '';
  elements.phone.value = doctor.phone || '';
  elements.profession.value = doctor.profession || '';
  elements.specialty.value = doctor.specialties?.join(', ') || doctor.specialty || '';
  elements.address.value = doctor.address || '';
  elements.branch.value = doctor.branch || '';
  elements.email.value = doctor.email || '';
  elements.mapUrl.value = doctor.mapUrl || '';
  elements.about.value = doctor.about || '';
  elements.treatments.value = doctor.treatments?.join(', ') || '';
  elements.socialX.value = doctor.social?.x || '';
  elements.socialFacebook.value = doctor.social?.facebook || '';
  elements.socialInstagram.value = doctor.social?.instagram || '';
  elements.socialTiktok.value = doctor.social?.tiktok || '';
  elements.photoName.value = doctor.photoName || '';
  elements.slug.value = doctor.slug || '';
  elements.priority.value = doctor.priority ?? '';
  elements.active.checked = doctor.active !== undefined ? doctor.active : true;
  doctorForm.querySelector('#modal-title').textContent = `Editar: ${doctor.fullName}`;
};

const openModal = (doctor = null) => {
  if (!modal) return;
  if (doctor) {
    currentDoctor = doctor;
    fillDoctorForm(doctor);
  } else {
    resetDoctorForm();
  }

  if (typeof modal.showModal === 'function') {
    modal.showModal();
  } else {
    modal.setAttribute('open', 'true');
  }
};

const closeModal = () => {
  if (!modal) return;
  if (typeof modal.close === 'function') {
    modal.close();
  } else {
    modal.removeAttribute('open');
  }
  saveButton?.removeAttribute('data-loading');
  doctorForm.removeAttribute('data-error');
};

const collectFormData = () => {
  const elements = formElements();
  return {
    firstName: elements.firstName.value,
    lastName: elements.lastName.value,
    phone: elements.phone.value,
    profession: elements.profession.value,
    specialty: elements.specialty.value,
    specialties: parseSpecialties(elements.specialty.value),
    address: elements.address.value,
    branch: elements.branch.value,
    email: elements.email.value,
    mapUrl: elements.mapUrl.value,
    about: elements.about.value,
    treatments: parseTreatments(elements.treatments.value),
    social: {
      x: elements.socialX.value,
      facebook: elements.socialFacebook.value,
      instagram: elements.socialInstagram.value,
      tiktok: elements.socialTiktok.value,
    },
    photoName: elements.photoName.value,
    slug: elements.slug.value,
    priority: elements.priority.value,
    active: elements.active.checked,
  };
};

const stateMessage = (text) => renderStateMessage(statusContainer, text);

const filterDoctors = () => {
  const term = (searchInput?.value || '').trim().toLowerCase();
  const status = filterSelect?.value || 'all';

  const matchesSearch = (doctor) => {
    if (!term) return true;
    const index = [
      doctor.fullName,
      doctor.profession,
      doctor.branch,
      doctor.address,
      doctor.email,
      doctor.phone,
      doctor.slug,
      ...(doctor.specialties || []),
    ]
      .join(' ')
      .toLowerCase();
    return index.includes(term);
  };

  const matchesStatus = (doctor) => {
    if (status === 'active') return doctor.active;
    if (status === 'inactive') return !doctor.active;
    return true;
  };

  return doctorsCache.filter((doctor) => matchesSearch(doctor) && matchesStatus(doctor));
};

const refreshTable = () => {
  const filtered = filterDoctors();

  renderDoctorTable(tableBody, filtered, {
    onEdit: (doctor) => openModal(doctor),
    onToggle: async (doctor) => {
      const nextState = !doctor.active;
      if (!confirm(`¿Seguro que querés ${nextState ? 'reactivar' : 'dar de baja'} a ${doctor.fullName}?`)) {
        return;
      }
      try {
        await updateDoctor(doctor.id, { ...doctor, active: nextState });
        stateMessage(`Se ${nextState ? 'reactivó' : 'dio de baja'} a ${doctor.fullName}.`);
      } catch (error) {
        console.error('No se pudo actualizar el estado', error);
        stateMessage('Error al actualizar el estado del profesional.');
      }
    },
    onDelete: async (doctor) => {
      if (!confirm(`¿Eliminar definitivamente a ${doctor.fullName}? Esta acción no se puede deshacer.`)) {
        return;
      }
      try {
        await removeDoctor(doctor.id);
        stateMessage(`El profesional ${doctor.fullName} fue eliminado.`);
      } catch (error) {
        console.error('Error al eliminar profesional', error);
        stateMessage('No se pudo eliminar el profesional.');
      }
    },
  });

  if (doctorsCache.length === 0) {
    stateMessage('Todavía no hay profesionales cargados.');
  } else if (filtered.length === doctorsCache.length && !searchInput.value && (filterSelect?.value === 'all')) {
    stateMessage(`Mostrando ${filtered.length} profesional${filtered.length === 1 ? '' : 'es'}.`);
  } else {
    stateMessage(`Mostrando ${filtered.length} de ${doctorsCache.length} profesional${doctorsCache.length === 1 ? '' : 'es'}.`);
  }
};

const subscribeDoctors = () => {
  doctorsUnsubscribe?.();
  doctorsUnsubscribe = watchDoctors((doctors) => {
    doctorsCache = doctors
      .map((doctor) => ({
        ...doctor,
        fullName: doctor.fullName || formatFullName(doctor.firstName, doctor.lastName),
      }))
      .sort((a, b) => {
        const priorityDiff = (b.priority || 0) - (a.priority || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return a.fullName.localeCompare(b.fullName, 'es', { sensitivity: 'base' });
      });
    refreshTable();
  });
};

const handleAuthChange = (user) => {
  if (user) {
    loginView.hidden = true;
    adminApp.hidden = false;
    hideSplash();
    subscribeDoctors();
    stateMessage('Cargando registros...');
  } else {
    doctorsUnsubscribe?.();
    doctorsCache = [];
    renderDoctorTable(tableBody, []);
    adminApp.hidden = true;
    loginView.hidden = false;
    stateMessage('');
  }
};

const attachEvents = () => {
  createButton?.addEventListener('click', () => openModal());
  logoutButton?.addEventListener('click', async () => {
    try {
      await logout();
      stateMessage('Sesión finalizada.');
    } catch (error) {
      console.error('No se pudo cerrar la sesión', error);
      stateMessage('No pudimos cerrar la sesión, intenta de nuevo.');
    }
  });

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginError?.setAttribute('hidden', 'true');
    const email = loginForm.elements.email.value.trim();
    const password = loginForm.elements.password.value.trim();

    if (!email || !password) {
      loginError.textContent = 'Completá usuario y contraseña.';
      loginError.removeAttribute('hidden');
      return;
    }

    loginForm.classList.add('is-loading');
    try {
      await loginWithEmail(email, password);
      loginForm.reset();
      loginError.textContent = '';
      loginError.setAttribute('hidden', 'true');
    } catch (error) {
      console.error('Error al iniciar sesión', error);
      loginError.textContent = 'Correo o contraseña incorrectos.';
      loginError.removeAttribute('hidden');
    } finally {
      loginForm.classList.remove('is-loading');
    }
  });

  doctorForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    doctorForm.removeAttribute('data-error');

    if (!doctorForm.reportValidity()) return;

    saveButton?.setAttribute('data-loading', 'true');

    try {
      const payload = collectFormData();
      if (currentDoctor) {
        await updateDoctor(currentDoctor.id, { ...currentDoctor, ...payload });
        stateMessage(`Se actualizó a ${formatFullName(payload.firstName, payload.lastName)}.`);
      } else {
        await createDoctor(payload);
        stateMessage(`Se creó a ${formatFullName(payload.firstName, payload.lastName)}.`);
      }
      closeModal();
    } catch (error) {
      console.error('Error al guardar profesional', error);
      doctorForm.setAttribute('data-error', 'true');
      stateMessage('No pudimos guardar el profesional. Revisá los datos e intentá nuevamente.');
    } finally {
      saveButton?.removeAttribute('data-loading');
    }
  });

  if (typeof modal?.addEventListener === 'function') {
    modal.addEventListener('close', () => {
      doctorForm.removeAttribute('data-error');
      currentDoctor = null;
    });
  }

  searchInput?.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      refreshTable();
    }, 200);
  });

  filterSelect?.addEventListener('change', refreshTable);
};

const init = () => {
  attachEvents();
  authUnsubscribe = watchAuth(handleAuthChange);
  setTimeout(() => hideSplash(), 800);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.addEventListener('beforeunload', () => {
  authUnsubscribe?.();
  doctorsUnsubscribe?.();
});
