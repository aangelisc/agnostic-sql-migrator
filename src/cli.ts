#!/usr/bin/env node
import { migrator } from "./config";

migrator().catch((err) => {
  process.exitCode = 1;
  console.log(err);
});
