import { createAsyncThunk } from '@reduxjs/toolkit';
import { toApiError } from '@/services/api/responseHandler';
import { resourceService, type CheckoutPayload } from '@/services/resource/resourceService';
import { formatToFulfilmentType, type CartItemsResponse, type Resource, type ResourceFormat, type ResourcesResponse } from '@/types/resource';

export const fetchResourcesThunk = createAsyncThunk<
  ResourcesResponse,
  { search?: string; page?: number; limit?: number },
  { rejectValue: ReturnType<typeof toApiError> }
>('resource/fetchResources', async (params, { rejectWithValue }) => {
  try {
    return await resourceService.getResources(params);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const addToCartThunk = createAsyncThunk<
  { resource: Resource; format: ResourceFormat },
  { resource: Resource; format: ResourceFormat },
  { rejectValue: ReturnType<typeof toApiError> }
>('resource/addToCart', async ({ resource, format }, { rejectWithValue }) => {
  try {
    await resourceService.addToCart({
      resourceItemId: resource.id,
      fulfilmentType: formatToFulfilmentType[format],
      quantity: 1,
    });
    return { resource, format };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const fetchCartThunk = createAsyncThunk<
  CartItemsResponse,
  { page?: number; limit?: number },
  { rejectValue: ReturnType<typeof toApiError> }
>('resource/fetchCart', async (params, { rejectWithValue }) => {
  try {
    return await resourceService.getCart(params);
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const removeFromCartThunk = createAsyncThunk<
  { cartId: string },
  string,
  { rejectValue: ReturnType<typeof toApiError> }
>('resource/removeFromCart', async (cartId, { rejectWithValue }) => {
  try {
    await resourceService.removeFromCart(cartId);
    return { cartId };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});

export const checkoutThunk = createAsyncThunk<
  { status: string; orderId?: string; reference: string; checkoutUrl?: string; pickupCode?: string; totalAmount: number; currency: string; walletTransfer?: import('@/services/resource/resourceService').WalletTransfer },
  CheckoutPayload,
  { rejectValue: ReturnType<typeof toApiError> }
>('resource/checkout', async (payload, { rejectWithValue }) => {
  try {
    const response = await resourceService.checkout(payload);
    const data = response.data;
    if (!data) {
      throw new Error(response.message || 'Unable to process checkout.');
    }
    return {
      status: data.status,
      orderId: data.orderId,
      reference: data.reference,
      checkoutUrl: data.checkoutUrl,
      pickupCode: data.pickupCode,
      totalAmount: data.totalAmount,
      currency: data.currency,
      walletTransfer: data.walletTransfer,
    };
  } catch (error) {
    return rejectWithValue(toApiError(error));
  }
});
