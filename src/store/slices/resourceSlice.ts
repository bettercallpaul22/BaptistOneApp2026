import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { logout } from '@/store/slices/authSlice';
import {
  addToCartThunk,
  checkoutThunk,
  fetchCartThunk,
  fetchResourcesThunk,
  removeFromCartThunk,
} from '@/store/thunks/resourceThunk';
import type { CartItem, Resource, ResourceMeta } from '@/types/resource';
import type { WalletTransfer } from '@/services/resource/resourceService';

export interface CheckoutResult {
  status: string;
  orderId?: string;
  reference: string;
  checkoutUrl?: string;
  pickupCode?: string;
  totalAmount: number;
  currency: string;
  walletTransfer?: WalletTransfer;
}

interface ResourceState {
  items: Resource[];
  meta: ResourceMeta | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  search: string;
  cart: CartItem[];
  cartMeta: ResourceMeta | null;
  cartLoading: boolean;
  cartLoadingMore: boolean;
  cartError: string | null;
  cartAdding: string | null;
  cartRemoving: string | null;
  checkoutLoading: boolean;
  checkoutError: string | null;
  checkoutResult: CheckoutResult | null;
}

const initialState: ResourceState = {
  items: [],
  meta: null,
  loading: false,
  loadingMore: false,
  error: null,
  search: '',
  cart: [],
  cartMeta: null,
  cartLoading: false,
  cartLoadingMore: false,
  cartError: null,
  cartAdding: null,
  cartRemoving: null,
  checkoutLoading: false,
  checkoutError: null,
  checkoutResult: null,
};

export const resourceSlice = createSlice({
  name: 'resource',
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    clearCartState: (state) => {
      state.cart = [];
      state.cartMeta = null;
      state.cartError = null;
    },
    clearResourceError: (state) => {
      state.error = null;
    },
    clearCartError: (state) => {
      state.cartError = null;
    },
    clearCheckoutStatus: (state) => {
      state.checkoutLoading = false;
      state.checkoutError = null;
    },
    clearCheckoutResult: (state) => {
      state.checkoutResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResourcesThunk.pending, (state, action) => {
        const { page } = action.meta.arg;
        if (page && page > 1) {
          state.loadingMore = true;
        } else {
          state.loading = true;
          state.items = [];
        }
        state.error = null;
      })
      .addCase(fetchResourcesThunk.fulfilled, (state, action) => {
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
      })
      .addCase(fetchResourcesThunk.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload?.message ?? 'Unable to load resources.';
      })

      .addCase(addToCartThunk.pending, (state, action) => {
        state.cartAdding = `${action.meta.arg.resource.id}-${action.meta.arg.format}`;
      })
      .addCase(addToCartThunk.fulfilled, (state) => {
        state.cartAdding = null;
        if (state.cartMeta) {
          state.cartMeta.total += 1;
        }
      })
      .addCase(addToCartThunk.rejected, (state) => {
        state.cartAdding = null;
      })

      .addCase(fetchCartThunk.pending, (state, action) => {
        const { page } = action.meta.arg;
        if (page && page > 1) {
          state.cartLoadingMore = true;
        } else if (state.cart.length === 0) {
          state.cartLoading = true;
        }
        state.cartError = null;
      })
      .addCase(fetchCartThunk.fulfilled, (state, action) => {
        const { page = 1 } = action.meta.arg;
        const { items, meta } = action.payload.data;

        if (page > 1) {
          state.cart = [...state.cart, ...items];
        } else {
          state.cart = items;
        }

        state.cartMeta = meta;
        state.cartLoading = false;
        state.cartLoadingMore = false;
      })
      .addCase(fetchCartThunk.rejected, (state, action) => {
        state.cartLoading = false;
        state.cartLoadingMore = false;
        state.cartError = action.payload?.message ?? 'Unable to load cart.';
      })

      .addCase(removeFromCartThunk.pending, (state, action) => {
        state.cartRemoving = action.meta.arg;
      })
      .addCase(removeFromCartThunk.fulfilled, (state, action) => {
        state.cart = state.cart.filter((item) => item.cartId !== action.payload.cartId);
        state.cartRemoving = null;
        if (state.cartMeta) {
          state.cartMeta.total = Math.max(0, state.cartMeta.total - 1);
        }
      })
      .addCase(removeFromCartThunk.rejected, (state) => {
        state.cartRemoving = null;
      })

      .addCase(checkoutThunk.pending, (state) => {
        state.checkoutLoading = true;
        state.checkoutError = null;
      })
      .addCase(checkoutThunk.fulfilled, (state, action) => {
        state.checkoutLoading = false;
        state.checkoutError = null;
        state.checkoutResult = action.payload;
      })
      .addCase(checkoutThunk.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.checkoutError = action.payload?.message ?? 'Unable to process checkout.';
      })

      .addCase(logout, () => initialState);
  },
});

export const {
  setSearch,
  clearCartState,
  clearResourceError,
  clearCartError,
  clearCheckoutStatus,
  clearCheckoutResult,
} = resourceSlice.actions;
export const resourceReducer = resourceSlice.reducer;
