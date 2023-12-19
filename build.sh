#!/bin/bash
node --no-warnings=ExperimentalWarning --loader ts-node/esm ./src/pipeline/vue-sfc-compile.ts --compile
etsc --config=etsc.config.cjs
node --no-warnings=ExperimentalWarning --loader ts-node/esm ./src/pipeline/vue-sfc-compile.ts --clean