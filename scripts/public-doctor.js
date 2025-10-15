import { fetchDoctorBySlug, fetchDoctorById } from './db.js';
import { renderDoctorDetail, renderStateMessage } from './render.js';
import { setupSiteHeader } from './site.js';

setupSiteHeader();

const stateContainer = document.getElementById('state');
const params = new URLSearchParams(window.location.search);

const enhanceMetadata = (doctor) => {
  const title = `LabClinics | ${doctor.fullName}`;
  document.title = title;

  const setMeta = (selector, attr, value) => {
    const element = document.querySelector(selector);
    if (element) element.setAttribute(attr, value);
  };

  setMeta('meta[name="description"]', 'content', `${doctor.fullName} — ${doctor.profession || 'Profesional de LabClinics'}.`);
  setMeta('meta[property="og:title"]', 'content', title);
  setMeta('meta[property="og:description"]', 'content', doctor.about || 'Nuestra exactitud es cuestión de vida.');
  setMeta('meta[property="og:image"]', 'content', doctor.photoUrl);
};

const showMessage = (message) => {
  renderStateMessage(stateContainer, message);
};

const loadDoctor = async () => {
  const slug = params.get('slug');
  const id = params.get('id');

  if (!slug && !id) {
    showMessage('Necesitamos un identificador de profesional para mostrar la ficha.');
    return;
  }

  showMessage('Cargando perfil del profesional...');

  try {
    let doctor = null;
    if (slug) {
      doctor = await fetchDoctorBySlug(slug);
    }
    if (!doctor && id) {
      doctor = await fetchDoctorById(id);
    }

    if (!doctor) {
      showMessage('No encontramos este profesional. Verifica el enlace o contacta al laboratorio.');
      return;
    }

    if (!doctor.active) {
      showMessage('Este perfil no está disponible actualmente.');
      return;
    }

    renderDoctorDetail(doctor);
    showMessage('');
    enhanceMetadata(doctor);
  } catch (error) {
    console.error('Error al cargar la ficha del profesional', error);
    showMessage('Tuvimos un problema al cargar la información. Intentá nuevamente en unos minutos.');
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadDoctor);
} else {
  loadDoctor();
}
