import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

import { firebaseApp } from './firebase-config.js';
import {
  slugify,
  ensureArray,
  cleanObject,
  sanitizeUrl,
  formatFullName,
  parseSpecialties,
  parseTreatments,
  cleanPhone,
} from './utils.js';

const db = getFirestore(firebaseApp);
const doctorsCollection = collection(db, 'doctors');
const DEFAULT_PHOTO = 'assets/placeholders/doctor.png';

const normalizeSocial = (social = {}) => {
  const entries = Object.entries(social).map(([key, value]) => [key, sanitizeUrl(value)]);
  return cleanObject(Object.fromEntries(entries));
};

const resolvePhotoUrl = (photoName = '') => {
  const trimmed = photoName?.toString().trim();
  return trimmed ? `assets/doctors/${trimmed}` : DEFAULT_PHOTO;
};

const mapDoctor = (snapshot) => {
  if (!snapshot?.exists()) return null;
  const data = snapshot.data();
  const specialtiesArray = parseSpecialties(data.specialties || data.specialty);
  const treatmentsArray = parseTreatments(data.treatments);

  return {
    id: snapshot.id,
    ...data,
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    fullName: formatFullName(data.firstName, data.lastName),
    phone: data.phone || '',
    cleanPhone: cleanPhone(data.phone || ''),
    profession: data.profession || '',
    specialties: specialtiesArray,
    specialty: data.specialty || specialtiesArray[0] || '',
    address: data.address || '',
    branch: data.branch || '',
    email: data.email || '',
    mapUrl: data.mapUrl || '',
    about: data.about || '',
    treatments: treatmentsArray,
    social: data.social || {},
    photoName: data.photoName || '',
    photoUrl: resolvePhotoUrl(data.photoName),
    slug: data.slug || slugify(`${data.firstName || ''}-${data.lastName || ''}`),
    active: data.active !== undefined ? data.active : true,
    priority: typeof data.priority === 'number' ? data.priority : 0,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};

export const watchDoctors = (callback, { includeInactive = true } = {}) => {
  const constraints = includeInactive
    ? [orderBy('lastName', 'asc')]
    : [where('active', '==', true), orderBy('lastName', 'asc')];

  const unsubscribe = onSnapshot(query(doctorsCollection, ...constraints), (snapshot) => {
    const doctors = snapshot.docs.map(mapDoctor).filter(Boolean);
    callback(doctors);
  });

  return unsubscribe;
};

export const fetchActiveDoctors = async () => {
  const snapshot = await getDocs(query(doctorsCollection, where('active', '==', true)));
  return snapshot.docs.map(mapDoctor).filter(Boolean);
};

export const fetchDoctorBySlug = async (slug) => {
  if (!slug) return null;
  const snapshot = await getDocs(query(doctorsCollection, where('slug', '==', slug), limit(1)));
  if (snapshot.empty) return null;
  return mapDoctor(snapshot.docs[0]);
};

export const fetchDoctorById = async (id) => {
  if (!id) return null;
  const snapshot = await getDoc(doc(db, 'doctors', id));
  return mapDoctor(snapshot);
};

export const createDoctor = async (payload) => {
  const data = prepareDoctorPayload(payload);
  const now = serverTimestamp();
  const docRef = await addDoc(doctorsCollection, {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const updateDoctor = async (id, payload) => {
  const data = prepareDoctorPayload(payload);
  await updateDoc(doc(db, 'doctors', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const removeDoctor = async (id) => deleteDoc(doc(db, 'doctors', id));

const prepareDoctorPayload = (payload = {}) => {
  const firstName = payload.firstName?.trim() || '';
  const lastName = payload.lastName?.trim() || '';
  const slug = payload.slug?.trim() || slugify(`${firstName}-${lastName}`);
  const phone = payload.phone?.trim() || '';
  const social = normalizeSocial(payload.social);
  const specialtiesArray = parseSpecialties(payload.specialties || payload.specialty);
  const treatmentsArray = parseTreatments(payload.treatments);

  const base = {
    firstName,
    lastName,
    phone,
    profession: payload.profession?.trim() || '',
    specialty: specialtiesArray[0] || '',
    specialties: specialtiesArray,
    address: payload.address?.trim() || '',
    branch: payload.branch?.trim() || '',
    email: payload.email?.trim() || '',
    mapUrl: sanitizeUrl(payload.mapUrl || ''),
    about: payload.about?.trim() || '',
    treatments: treatmentsArray,
    social,
    photoName: payload.photoName?.trim() || '',
    slug,
    active: payload.active !== undefined ? !!payload.active : true,
    priority: Number.isFinite(Number(payload.priority)) ? Number(payload.priority) : 0,
    tags: ensureArray(payload.tags),
  };

  return cleanObject(base);
};

export const doctorDataHelpers = {
  mapDoctor,
  resolvePhotoUrl,
  prepareDoctorPayload,
};
