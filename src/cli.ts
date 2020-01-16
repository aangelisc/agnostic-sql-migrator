#!/usr/bin/env node
import { migrator } from "./config";

migrator()
  .then(console.log)
  .catch(console.log);
