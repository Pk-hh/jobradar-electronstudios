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
        const snapshot = await getDocs(jobsRef);
        let jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // In-memory filtering to avoid Firestore composite index requirement errors
        if (params.category && params.category !== 'All') {
          jobs = jobs.filter(j => j.category === params.category);
        }

        if (params.sub_category && params.sub_category !== 'All') {
          const subCat = params.sub_category.toLowerCase();
          jobs = jobs.filter(j => {
            const matchSubCat = j.sub_category && j.sub_category.toLowerCase().includes(subCat);
            const matchTitle = j.title && j.title.toLowerCase().includes(subCat);
            const matchTags = Array.isArray(j.tags) && j.tags.some(t => t.toLowerCase().includes(subCat));
            return matchSubCat || matchTitle || matchTags;
          });
        }

        if (params.search) {
          const s = params.search.toLowerCase();
          jobs = jobs.filter(j =>
            (j.title && j.title.toLowerCase().includes(s)) ||
            (j.company && j.company.toLowerCase().includes(s)) ||
            (j.description && j.description.toLowerCase().includes(s)) ||
            (j.location && j.location.toLowerCase().includes(s)) ||
            (j.qualification && j.qualification.toLowerCase().includes(s))
          );
        }

        if (params.work_mode && params.work_mode !== 'All') {
          jobs = jobs.filter(j => j.work_mode === params.work_mode);
        }

        if (params.type && params.type !== 'All') {
          jobs = jobs.filter(j => j.type === params.type);
        }

        if (params.location && params.location !== 'All') {
          jobs = jobs.filter(j => j.location === params.location);
        }

        if (params.verified_only) {
          jobs = jobs.filter(j => Boolean(j.verified));
        }

        // Sort by posted_at descending
        jobs.sort((a, b) => {
          const timeA = new Date(a.posted_at || 0).getTime();
          const timeB = new Date(b.posted_at || 0).getTime();
          return timeB - timeA;
        });

        return { jobs, pagination: { total: jobs.length } };
      }
    } catch (err) {
      console.warn('Firestore fetch failed, using local REST API:', err);
    }
    return jobApi.getJobs(params);
  },

  // Fetch Recommendations from Firestore or API
  getRecommendations: async () => {
    try {
      if (isFirebaseConfigured()) {
        const jobsRef = collection(db, 'jobs');
        const snapshot = await getDocs(jobsRef);
        let jobs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          match_score: Math.floor(Math.random() * 15) + 85
        }));
        return { recommendations: jobs.slice(0, 5) };
      }
    } catch (err) {
      console.warn('Firestore recommendations failed, using local API:', err);
    }
    return jobApi.getRecommendations();
  },

  // Fetch Single Job Details
  getJobDetails: async (id) => {
    try {
      if (isFirebaseConfigured()) {
        const jobRef = doc(db, 'jobs', id);
        const docSnap = await getDoc(jobRef);
        if (docSnap.exists()) {
          try {
            await updateDoc(jobRef, { views_count: increment(1) });
          } catch (e) {}
          return { job: { id: docSnap.id, ...docSnap.data() } };
        }
      }
    } catch (err) {
      console.warn('Firestore single job fetch failed, using local API:', err);
    }
    return jobApi.getJobDetails(id);
  },

  // Save / Bookmark Job in Firestore
  toggleSave: async (jobId, userId = 'current_user') => {
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

  toggleSaveJob: function(userId, jobId) {
    return this.toggleSave(jobId, userId);
  },

  // Fetch Saved Jobs
  getSavedJobs: async (userId = 'current_user') => {
    try {
      if (isFirebaseConfigured()) {
        const savedColRef = collection(db, 'users', userId, 'saved_jobs');
        const savedSnap = await getDocs(savedColRef);
        const savedJobIds = savedSnap.docs.map(doc => doc.id);

        if (savedJobIds.length === 0) {
          return { saved_jobs: [] };
        }

        const jobsRef = collection(db, 'jobs');
        const jobsSnap = await getDocs(jobsRef);
        const allJobs = jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), is_saved: true }));
        const savedJobs = allJobs.filter(j => savedJobIds.includes(j.id));
        return { saved_jobs: savedJobs };
      }
    } catch (err) {
      console.warn('Firestore getSavedJobs failed, using local API:', err);
    }
    return jobApi.getSavedJobs();
  },

  // Track Job Application Status
  trackApplication: async (jobId, status, userId = 'current_user') => {
    try {
      if (isFirebaseConfigured()) {
        const appRef = doc(db, 'users', userId, 'applications', jobId);
        await setDoc(appRef, { status, updated_at: new Date().toISOString(), job_id: jobId });
        return { message: 'Application status updated' };
      }
    } catch (err) {
      console.warn('Firestore trackApplication failed, using local API:', err);
    }
    return jobApi.trackApplication(jobId, status);
  },

  // Log Job Apply Clicks
  logApplyClick: async (jobId) => {
    try {
      if (isFirebaseConfigured()) {
        const jobRef = doc(db, 'jobs', jobId);
        await updateDoc(jobRef, { clicks_count: increment(1) });
        return { message: 'Click logged' };
      }
    } catch (err) {
      console.warn('Firestore logApplyClick failed, using local API:', err);
    }
    return jobApi.logApplyClick(jobId);
  },

  // Report Job Notification
  reportJob: async (jobId, reason, details) => {
    try {
      if (isFirebaseConfigured()) {
        const reportRef = doc(db, 'reports', `report_${Date.now()}`);
        await setDoc(reportRef, { jobId, reason, details, created_at: new Date().toISOString() });
        return { message: 'Report submitted' };
      }
    } catch (err) {
      console.warn('Firestore reportJob failed, using local API:', err);
    }
    return jobApi.reportJob(jobId, reason, details);
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
