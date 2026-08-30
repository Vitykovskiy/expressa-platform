export type DevelopmentEnvironment =
  (typeof import("./development-otp.adapter.constants").developmentEnvironments)[number];
