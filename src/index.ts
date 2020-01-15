import { entrypoint } from "./config";
export * from "./config";
export * from "./migrations";
export * from "./version";
export * from "./adapters";

entrypoint().catch(err => console.log(err));
