import type { developmentEnvironments } from "./development-otp.adapter.constants";

export type DevelopmentEnvironment = (typeof developmentEnvironments)[number];
