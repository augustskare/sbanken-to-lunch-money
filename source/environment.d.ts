declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SBANKEN_CLIENT_ID: string;
      SBANKEN_PASSWORD: string;
      LM_ACCESS_TOKEN: string;
    }
  }
}

export {};
