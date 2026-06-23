import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import {
  fetchConventionProgramsThunk,
  fetchConventionPublicationsThunk,
  fetchConventionAnnouncementsThunk,
  fetchConventionDocumentsThunk,
  registerForProgramThunk,
  fetchProgramRegistrationsThunk,
  purchasePublicationThunk,
  fetchPublicationAccessesThunk,
} from '@/store/thunks/conventionThunk';
import type {
  ConventionAnnouncement,
  ConventionDocument,
  ConventionMeta,
  ConventionProgram,
  ConventionProgramRegistration,
  ConventionPublication,
  ConventionPublicationAccess,
  ConventionRegisterResponse,
  ConventionPurchaseResponse,
} from '@/types/convention';

interface CollectionState<T> {
  items: T[];
  meta: ConventionMeta | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

interface ConventionState {
  conventionId: string | null;
  programs: CollectionState<ConventionProgram>;
  publications: CollectionState<ConventionPublication>;
  announcements: CollectionState<ConventionAnnouncement>;
  documents: CollectionState<ConventionDocument>;
  registrations: { items: ConventionProgramRegistration[]; loading: boolean; error: string | null };
  accesses: { items: ConventionPublicationAccess[]; loading: boolean; error: string | null };
  registrationLoading: boolean;
  registrationError: string | null;
  registrationResult: ConventionRegisterResponse | null;
  purchaseLoading: boolean;
  purchaseError: string | null;
  purchaseResult: ConventionPurchaseResponse | null;
}

const initialCollection = <T>(): CollectionState<T> => ({
  items: [],
  meta: null,
  loading: false,
  loadingMore: false,
  error: null,
});

const initialState: ConventionState = {
  conventionId: null,
  programs: initialCollection(),
  publications: initialCollection(),
  announcements: initialCollection(),
  documents: initialCollection(),
  registrations: { items: [], loading: false, error: null },
  accesses: { items: [], loading: false, error: null },
  registrationLoading: false,
  registrationError: null,
  registrationResult: null,
  purchaseLoading: false,
  purchaseError: null,
  purchaseResult: null,
};

const handleCollectionPending = <T>(state: CollectionState<T>, action: { meta: { arg: { page?: number } } }) => {
  const { page } = action.meta.arg;
  if (page && page > 1) {
    state.loadingMore = true;
  } else {
    state.loading = true;
    state.items = [];
  }
  state.error = null;
};

const handleCollectionFulfilled = <T>(state: CollectionState<T>, action: { payload: { data: { items: T[]; meta: ConventionMeta } }; meta: { arg: { page?: number } } }) => {
  const { page = 1 } = action.meta.arg;
  const { items, meta } = action.payload.data;
  if (page > 1) {
    state.items = [...state.items, ...items];
  } else {
    state.items = items;
  }
  state.meta = meta;
  state.loading = false;
  state.loadingMore = false;
};

const handleCollectionRejected = <T>(state: CollectionState<T>, action: { payload?: { message?: string } }) => {
  state.loading = false;
  state.loadingMore = false;
  state.error = action.payload?.message ?? 'Unable to load data.';
};

export const conventionSlice = createSlice({
  name: 'convention',
  initialState,
  reducers: {
    setConventionId: (state, action: PayloadAction<string | null>) => {
      state.conventionId = action.payload;
    },
    clearConventionData: () => initialState,
    clearRegistrationResult: (state) => {
      state.registrationResult = null;
    },
    clearPurchaseResult: (state) => {
      state.purchaseResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConventionProgramsThunk.pending, (state, action) => {
        handleCollectionPending(state.programs, action);
      })
      .addCase(fetchConventionProgramsThunk.fulfilled, (state, action) => {
        handleCollectionFulfilled(state.programs, action);
      })
      .addCase(fetchConventionProgramsThunk.rejected, (state, action) => {
        handleCollectionRejected(state.programs, action);
      })

      .addCase(fetchConventionPublicationsThunk.pending, (state, action) => {
        handleCollectionPending(state.publications, action);
      })
      .addCase(fetchConventionPublicationsThunk.fulfilled, (state, action) => {
        handleCollectionFulfilled(state.publications, action);
      })
      .addCase(fetchConventionPublicationsThunk.rejected, (state, action) => {
        handleCollectionRejected(state.publications, action);
      })

      .addCase(fetchConventionAnnouncementsThunk.pending, (state, action) => {
        handleCollectionPending(state.announcements, action);
      })
      .addCase(fetchConventionAnnouncementsThunk.fulfilled, (state, action) => {
        handleCollectionFulfilled(state.announcements, action);
      })
      .addCase(fetchConventionAnnouncementsThunk.rejected, (state, action) => {
        handleCollectionRejected(state.announcements, action);
      })

      .addCase(fetchConventionDocumentsThunk.pending, (state, action) => {
        handleCollectionPending(state.documents, action);
      })
      .addCase(fetchConventionDocumentsThunk.fulfilled, (state, action) => {
        handleCollectionFulfilled(state.documents, action);
      })
      .addCase(fetchConventionDocumentsThunk.rejected, (state, action) => {
        handleCollectionRejected(state.documents, action);
      })

      .addCase(fetchProgramRegistrationsThunk.pending, (state) => {
        state.registrations.loading = true;
        state.registrations.error = null;
      })
      .addCase(fetchProgramRegistrationsThunk.fulfilled, (state, action) => {
        state.registrations.items = action.payload.data.items;
        state.registrations.loading = false;
      })
      .addCase(fetchProgramRegistrationsThunk.rejected, (state, action) => {
        state.registrations.loading = false;
        state.registrations.error = action.payload?.message ?? 'Unable to load registrations.';
      })

      .addCase(fetchPublicationAccessesThunk.pending, (state) => {
        state.accesses.loading = true;
        state.accesses.error = null;
      })
      .addCase(fetchPublicationAccessesThunk.fulfilled, (state, action) => {
        state.accesses.items = action.payload.data.items;
        state.accesses.loading = false;
      })
      .addCase(fetchPublicationAccessesThunk.rejected, (state, action) => {
        state.accesses.loading = false;
        state.accesses.error = action.payload?.message ?? 'Unable to load accesses.';
      })

      .addCase(registerForProgramThunk.pending, (state) => {
        state.registrationLoading = true;
        state.registrationError = null;
      })
      .addCase(registerForProgramThunk.fulfilled, (state, action) => {
        state.registrationLoading = false;
        state.registrationResult = action.payload;
      })
      .addCase(registerForProgramThunk.rejected, (state, action) => {
        state.registrationLoading = false;
        state.registrationError = action.payload?.message ?? 'Unable to register.';
      })

      .addCase(purchasePublicationThunk.pending, (state) => {
        state.purchaseLoading = true;
        state.purchaseError = null;
      })
      .addCase(purchasePublicationThunk.fulfilled, (state, action) => {
        state.purchaseLoading = false;
        state.purchaseResult = action.payload;
      })
      .addCase(purchasePublicationThunk.rejected, (state, action) => {
        state.purchaseLoading = false;
        state.purchaseError = action.payload?.message ?? 'Unable to purchase.';
      })

      .addCase(logout, () => initialState);
  },
});

export const {
  setConventionId,
  clearConventionData,
  clearRegistrationResult,
  clearPurchaseResult,
} = conventionSlice.actions;
export const conventionReducer = conventionSlice.reducer;
