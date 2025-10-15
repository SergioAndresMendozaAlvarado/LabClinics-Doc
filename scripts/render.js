import { buildTelLink, buildWhatsAppLink } from './utils.js';

const createElement = (tag, options = {}) => Object.assign(document.createElement(tag), options);

const clearChildren = (node) => {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
};

const setOptionalVisibility = (element, visible) => {
  if (!element) return;
  if (visible) {
    element.classList.add('visible');
    element.hidden = false;
  } else {
    element.classList.remove('visible');
    element.hidden = true;
  }
};

const chipMarkup = (label) => {
  const chip = createElement('span', { className: 'chip' });
  chip.textContent = label;
  return chip;
};

const cardMetaLine = (iconConfig, text) => {
  const wrapper = createElement('div', { className: 'card-meta-line' });

  if (iconConfig?.src) {
    const icon = createElement('img', {
      className: 'card-meta-icon',
      src: iconConfig.src,
      alt: iconConfig.alt || '',
      width: iconConfig.width || 18,
      height: iconConfig.height || 18,
      loading: 'lazy',
      decoding: 'async',
    });
    wrapper.appendChild(icon);
  }

  const label = createElement('span');
  label.textContent = text;
  wrapper.appendChild(label);

  return wrapper;
};

const CARD_ICONS = {
  branch: { src: 'assets/icons/icon-branch.svg', alt: 'Sucursal' },
  address: { src: 'assets/icons/icon-location.svg', alt: 'Direccion' },
  phone: { src: 'assets/icons/icon-phone.svg', alt: 'Telefono' },
};

const createDoctorCard = (doctor) => {
  const card = createElement('article', { className: 'card' });

  const header = createElement('div', { className: 'card-header' });
  const name = createElement('h3', { className: 'card-name', textContent: doctor.fullName });
  const profession = createElement('p', { className: 'card-profession', textContent: doctor.profession });
  header.append(name, profession);

  const meta = createElement('div', { className: 'card-meta' });
  const specialties = doctor.specialties?.length ? doctor.specialties : (doctor.specialty ? [doctor.specialty] : []);
  specialties.slice(0, 3).forEach((label) => meta.appendChild(chipMarkup(label)));

  if (!specialties.length) {
    meta.appendChild(chipMarkup('Especialidad no especificada'));
  }

  const details = createElement('div', { className: 'card-details' });
  if (doctor.branch) {
    details.appendChild(cardMetaLine(CARD_ICONS.branch, doctor.branch));
  }
  if (doctor.address) {
    details.appendChild(cardMetaLine(CARD_ICONS.address, doctor.address));
  }
  if (doctor.phone) {
    details.appendChild(cardMetaLine(CARD_ICONS.phone, doctor.phone));
  }

  const footer = createElement('div', { className: 'card-actions' });
  const profileLink = createElement('a', {
    className: 'btn secondary',
    href: `doctor.html?slug=${encodeURIComponent(doctor.slug)}`,
    textContent: 'Ver perfil',
  });
  footer.appendChild(profileLink);

  card.append(header, meta, details, footer);
  return card;
};

export const renderDoctorCards = (container, doctors = []) => {
  if (!container) return;
  clearChildren(container);
  const fragment = document.createDocumentFragment();
  doctors.forEach((doctor) => fragment.appendChild(createDoctorCard(doctor)));
  container.appendChild(fragment);
};

export const updateListStatus = (element, { filtered, total, query }) => {
  if (!element) return;
  if (!total) {
    element.textContent = 'Aún no hay profesionales cargados.';
    return;
  }

  if (filtered === total && !query) {
    element.textContent = `Mostrando ${total} profesional${total === 1 ? '' : 'es'}.`;
    return;
  }

  element.textContent = `Mostrando ${filtered} de ${total} profesional${total === 1 ? '' : 'es'}${query ? ` para “${query}”` : ''}.`;
};

export const updateEmptyState = (element, isEmpty) => {
  if (!element) return;
  element.hidden = !isEmpty;
};

export const populateSelectOptions = (select, options = []) => {
  if (!select) return;
  const selected = select.value;
  clearChildren(select);
  const fragment = document.createDocumentFragment();

  options.forEach(({ label, value }) => {
    const option = createElement('option', { value, textContent: label });
    fragment.appendChild(option);
  });

  select.appendChild(fragment);
  if ([...select.options].some((opt) => opt.value === selected)) {
    select.value = selected;
  }
};

export const renderDoctorDetail = (doctor) => {
  const photo = document.getElementById('photo');
  if (photo) {
    photo.src = doctor.photoUrl;
    photo.alt = `Foto de ${doctor.fullName}`;
  }

  const name = document.getElementById('doctor-name');
  if (name) name.textContent = doctor.fullName;

  const profession = document.getElementById('profession');
  if (profession) profession.textContent = doctor.profession;

  const specialtyContainer = document.getElementById('specialty');
  if (specialtyContainer) {
    clearChildren(specialtyContainer);
    const specialties = doctor.specialties?.length ? doctor.specialties : (doctor.specialty ? [doctor.specialty] : []);
    specialties.forEach((item) => specialtyContainer.appendChild(chipMarkup(item)));
  }

  const callLink = document.getElementById('call-link');
  if (callLink) {
    if (doctor.phone) {
      callLink.href = buildTelLink(doctor.phone);
      callLink.textContent = `Llamar ${doctor.phone}`;
      callLink.rel = 'nofollow';
      setOptionalVisibility(callLink, true);
    } else {
      setOptionalVisibility(callLink, false);
    }
  }

  const waLink = document.getElementById('wa-link');
  if (waLink) {
    if (doctor.phone) {
      waLink.href = buildWhatsAppLink(doctor.phone);
      waLink.textContent = 'WhatsApp';
      waLink.rel = 'nofollow';
      setOptionalVisibility(waLink, true);
    } else {
      setOptionalVisibility(waLink, false);
    }
  }

  const mapLink = document.getElementById('map-link');
  if (mapLink) {
    if (doctor.mapUrl) {
      mapLink.href = doctor.mapUrl;
      setOptionalVisibility(mapLink, true);
    } else {
      setOptionalVisibility(mapLink, false);
    }
  }

  const branchRow = document.getElementById('branch');
  if (branchRow) {
    const span = branchRow.querySelector('span');
    if (doctor.branch && span) {
      span.textContent = doctor.branch;
      setOptionalVisibility(branchRow, true);
    } else {
      setOptionalVisibility(branchRow, false);
    }
  }

  const addressRow = document.getElementById('address');
  if (addressRow) {
    const span = addressRow.querySelector('span') || addressRow;
    span.textContent = doctor.address;
  }

  const emailRow = document.getElementById('email');
  if (emailRow) {
    const link = document.getElementById('email-link');
    if (doctor.email && link) {
      link.href = `mailto:${doctor.email}`;
      link.textContent = doctor.email;
      setOptionalVisibility(emailRow, true);
    } else {
      setOptionalVisibility(emailRow, false);
    }
  }

  const treatmentsSection = document.getElementById('treatments');
  const treatmentsContainer = document.getElementById('treatments-chips');
  if (treatmentsSection && treatmentsContainer) {
    clearChildren(treatmentsContainer);
    if (doctor.treatments?.length) {
      doctor.treatments.forEach((item) => treatmentsContainer.appendChild(chipMarkup(item)));
      setOptionalVisibility(treatmentsSection, true);
    } else {
      setOptionalVisibility(treatmentsSection, false);
    }
  }

  const aboutSection = document.getElementById('about');
  const aboutText = document.getElementById('about-text');
  if (aboutSection && aboutText) {
    if (doctor.about) {
      aboutText.textContent = doctor.about;
      setOptionalVisibility(aboutSection, true);
    } else {
      aboutText.textContent = '';
      setOptionalVisibility(aboutSection, false);
    }
  }

  const socialSection = document.getElementById('social');
  if (socialSection) {
    const socialItems = socialSection.querySelectorAll('.social-item');
    let visibleCount = 0;
    socialItems.forEach((item) => {
      const key = item.dataset.key;
      const link = item.querySelector('a');
      if (key && doctor.social?.[key] && link) {
        link.href = doctor.social[key];
        link.target = '_blank';
        link.rel = 'noopener';
        item.classList.add('visible');
        item.hidden = false;
        visibleCount += 1;
      } else {
        item.classList.remove('visible');
        item.hidden = true;
      }
    });
    setOptionalVisibility(socialSection, visibleCount > 0);
  }
};

export const createDoctorTableRow = (doctor, handlers = {}) => {
  const row = createElement('tr');
  row.dataset.id = doctor.id;

  const nameCell = createElement('td', { textContent: doctor.fullName });
  const professionCell = createElement('td', { textContent: doctor.profession });
  const specialtyCell = createElement('td', { textContent: doctor.specialties?.join(', ') || doctor.specialty || '—' });
  const branchCell = createElement('td', { textContent: doctor.branch || '—' });
  const phoneCell = createElement('td', { textContent: doctor.phone || '—' });

  const statusCell = createElement('td');
  const statusBadge = createElement('span', {
    className: `status-badge ${doctor.active ? 'status-active' : 'status-inactive'}`,
    textContent: doctor.active ? 'Activo' : 'Inactivo',
  });
  statusCell.appendChild(statusBadge);

  const actionsCell = createElement('td');
  actionsCell.style.whiteSpace = 'nowrap';
  const editBtn = createElement('button', {
    className: 'btn ghost small',
    type: 'button',
    textContent: 'Editar',
  });
  editBtn.addEventListener('click', () => handlers.onEdit?.(doctor));

  const toggleBtn = createElement('button', {
    className: `btn ${doctor.active ? 'ghost' : 'primary'} small`,
    type: 'button',
    textContent: doctor.active ? 'Dar de baja' : 'Reactivar',
  });
  toggleBtn.addEventListener('click', () => handlers.onToggle?.(doctor));

  const deleteBtn = createElement('button', {
    className: 'btn danger small',
    type: 'button',
    textContent: 'Eliminar',
  });
  deleteBtn.addEventListener('click', () => handlers.onDelete?.(doctor));

  actionsCell.append(editBtn, toggleBtn, deleteBtn);

  row.append(nameCell, professionCell, specialtyCell, branchCell, phoneCell, statusCell, actionsCell);
  return row;
};

export const renderDoctorTable = (tbody, doctors = [], handlers = {}) => {
  if (!tbody) return;
  clearChildren(tbody);
  const fragment = document.createDocumentFragment();
  doctors.forEach((doctor) => fragment.appendChild(createDoctorTableRow(doctor, handlers)));
  tbody.appendChild(fragment);
};

export const renderStateMessage = (container, message = '') => {
  if (!container) return;
  container.textContent = message;
};

export const helpers = {
  clearChildren,
  setOptionalVisibility,
};
