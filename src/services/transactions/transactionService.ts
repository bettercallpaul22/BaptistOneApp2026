import { endpoints } from '@/services/api/endpoints';
import { http } from '@/services/api/http';
import type { TransactionVerificationResponse } from '@/types/transaction';

const verificationRequests = new Map<string, Promise<TransactionVerificationResponse>>();

export const transactionService = {
  verify: (reference: string) => {
    const normalizedReference = reference.trim();
    const cachedRequest = verificationRequests.get(normalizedReference);

    if (cachedRequest) {
      return cachedRequest;
    }

    const request = http
      .get<TransactionVerificationResponse>(endpoints.publicTransactions.verify(normalizedReference))
      .then((response) => {
        if (!response.status || !response.data) {
          throw new Error(response.message || 'Unable to verify wallet funding.');
        }

        return response;
      })
      .catch((error) => {
        verificationRequests.delete(normalizedReference);
        throw error;
      });

    verificationRequests.set(normalizedReference, request);

    return request;
  },

  verifyFunding: (reference: string) => transactionService.verify(reference),
};
