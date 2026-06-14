export const APP = {
  orangehrm: {
    baseUrl:
      process.env.ORANGEHRM_BASE_URL ??
      "https://opensource-demo.orangehrmlive.com",
  },
  reqres: {
    baseUrl: process.env.API_BASE_URL ?? "https://reqres.in",
  },
  internet: {
    baseUrl: "https://the-internet.herokuapp.com",
  },
} as const;
