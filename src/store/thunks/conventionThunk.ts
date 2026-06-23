import { createAsyncThunk } from '@reduxjs/toolkit';
import { toApiError } from '@/services/api/responseHandler';
import { conventionService } from '@/services/convention/conventionService';
import type {
  ConventionAnnouncementsResponse,
  ConventionDocumentsResponse,
  ConventionProgramRegistrationsResponse,
  ConventionProgramsResponse,
  ConventionPublicationAccessesResponse,
  ConventionPublicationsResponse,
  ConventionRegistrationPayload,
  ConventionRegisterResponse,
  ConventionPublicationPurchasePayload,
  ConventionPurchaseResponse,
} from '@/types/convention';

export const fetchConventionProgramsThunk = createAsyncThunk<
  ConventionProgramsResponse,
  { conventionId: string; page?: number; limit?: number; search?: string },
  { rejectValue: ReturnType<typeof toApiError> }
>('convention/fetchPrograms', async ({ conventionId, ...params }, { rejectWithValue }) => {
  try {
    return await conventionService.getPrograms(conventionId, params);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const fetchConventionPublicationsThunk = createAsyncThunk<
  ConventionPublicationsResponse,
  { conventionId: string; page?: number; limit?: number; search?: string },
  { rejectValue: ReturnType<typeof toApiError> }
>('convention/fetchPublications', async ({ conventionId, ...params }, { rejectWithValue }) => {
  try {
    return await conventionService.getPublications(conventionId, params);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const fetchConventionAnnouncementsThunk = createAsyncThunk<
  ConventionAnnouncementsResponse,
  { conventionId: string; page?: number; limit?: number; search?: string },
  { rejectValue: ReturnType<typeof toApiError> }
>('convention/fetchAnnouncements', async ({ conventionId, ...params }, { rejectWithValue }) => {
  try {
    return await conventionService.getAnnouncements(conventionId, params);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const fetchConventionDocumentsThunk = createAsyncThunk<
  ConventionDocumentsResponse,
  { conventionId: string; page?: number; limit?: number; search?: string },
  { rejectValue: ReturnType<typeof toApiError> }
>('convention/fetchDocuments', async ({ conventionId, ...params }, { rejectWithValue }) => {
  try {
    return await conventionService.getDocuments(conventionId, params);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const registerForProgramThunk = createAsyncThunk<
  ConventionRegisterResponse,
  { conventionId: string; programId: string; payload: ConventionRegistrationPayload },
  { rejectValue: ReturnType<typeof toApiError> }
>('convention/registerProgram', async ({ conventionId, programId, payload }, { rejectWithValue }) => {
  try {
    return await conventionService.registerForProgram(conventionId, programId, payload);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const fetchProgramRegistrationsThunk = createAsyncThunk<
  ConventionProgramRegistrationsResponse,
  string,
  { rejectValue: ReturnType<typeof toApiError> }
>('convention/fetchRegistrations', async (conventionId, { rejectWithValue }) => {
  try {
    return await conventionService.getProgramRegistrations(conventionId);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const purchasePublicationThunk = createAsyncThunk<
  ConventionPurchaseResponse,
  { conventionId: string; publicationId: string; payload: ConventionPublicationPurchasePayload },
  { rejectValue: ReturnType<typeof toApiError> }
>('convention/purchasePublication', async ({ conventionId, publicationId, payload }, { rejectWithValue }) => {
  try {
    return await conventionService.purchasePublication(conventionId, publicationId, payload);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const fetchPublicationAccessesThunk = createAsyncThunk<
  ConventionPublicationAccessesResponse,
  string,
  { rejectValue: ReturnType<typeof toApiError> }
>('convention/fetchAccesses', async (conventionId, { rejectWithValue }) => {
  try {
    return await conventionService.getPublicationAccesses(conventionId);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
