interface SessionTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

let tokens: SessionTokens = {
  accessToken: null,
  refreshToken: null,
};

export const tokenStore = {
  getAccessToken: () => tokens.accessToken,
  getRefreshToken: () => tokens.refreshToken,
  setAccessToken: (accessToken: string | null) => {
    tokens = { ...tokens, accessToken };
  },
  setSession: (sessionTokens: SessionTokens) => {
    tokens = sessionTokens;
  },
  clear: () => {
    tokens = {
      accessToken: null,
      refreshToken: null,
    };
  },
};
