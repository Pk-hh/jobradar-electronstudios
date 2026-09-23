import { db, storage } from '../firebase/config';
import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { jobApi, adminApi, notificationApi, authApi } from './api';

// Check if custom Firebase project ID is configured
export const isFirebaseConfigured = () => {
  const projId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  return Boolean(projId && projId !== 'job-portal-platform');
};

export const firebaseService = {
  // Upload file to Firebase Cloud Storage Bucket
  uploadFileToStorage: async (file) => {
    try {
      if (isFirebaseConfigured()) {
        const fileRef = ref(storage, `uploads/${Date.now()}-${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return { url: downloadUrl, filename: file.name };
      }
    } catch (err) {
      console.warn('Firebase Storage upload failed, falling back to server upload:', err);
    }
    // Fallback to local server /uploads folder
    return adminApi.uploadFile(file);
  },

  // Fetch Jobs from Firestore or API
  getJobs: async (params = {}) => {
    try {
      if (isFirebaseConfigured()) {
        const jobsRef = collection(db, 'jobs');
        let q = query(jobsRef, orderBy('posted_at', 'desc'));

        if (params.category && params.category !== 'All') {
          q = query(jobsRef, where('category', '==', params.category), orderBy('posted_at', 'desc'));
        }

        const snapshot = await getDocs(q);
        const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { jobs, pagination: { total: jobs.length } };
      }
    } catch (err) {
      console.warn('Firestore fetch failed, using local REST API:', err);
    }
    return jobApi.getJobs(params);
  },

  // Fetch Single Job Details
  getJobDetails: async (id) => {
    try {
      if (isFirebaseConfigured()) {
        const jobRef = doc(db, 'jobs', id);
        const docSnap = await getDoc(jobRef);
        if (docSnap.exists()) {
          // Increment view count in Firestore
          await updateDoc(jobRef, { views_count: increment(1) });
          return { job: { id: docSnap.id, ...docSnap.data() } };
        }
      }
    } catch (err) {
      console.warn('Firestore single job fetch failed, using local API:', err);
    }
    return jobApi.getJobDetails(id);
  },

  // Save / Bookmark Job in Firestore
  toggleSaveJob: async (userId, jobId) => {
    try {
      if (isFirebaseConfigured()) {
        const saveRef = doc(db, 'users', userId, 'saved_jobs', jobId);
        const docSnap = await getDoc(saveRef);
        if (docSnap.exists()) {
          await deleteDoc(saveRef);
          return { message: 'Job removed from saved list', is_saved: false };
        } else {
          await setDoc(saveRef, { saved_at: new Date().toISOString(), job_id: jobId });
          return { message: 'Job saved successfully', is_saved: true };
        }
      }
    } catch (err) {
      console.warn('Firestore save toggle failed, using local API:', err);
    }
    return jobApi.toggleSave(jobId);
  },

  // Create / Post Job in Firestore
  createJobInFirestore: async (jobData) => {
    try {
      if (isFirebaseConfigured()) {
        const id = 'job_' + Date.now();
        const jobRef = doc(db, 'jobs', id);
        const payload = {
          ...jobData,
          id,
          posted_at: new Date().toISOString(),
          views_count: 0,
          clicks_count: 0
        };
        await setDoc(jobRef, payload);
        return { message: 'Job posted to Firebase Firestore', job_id: id };
      }
    } catch (err) {
      console.warn('Firestore create job failed, using local API:', err);
    }
    return adminApi.createJob(jobData);
  }
};
