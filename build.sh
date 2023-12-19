#!/bin/bash
T="$(date +%s%3N)"
node --no-warnings=ExperimentalWarning --loader ts-node/esm ./src/pipeline/vue-sfc-compile.ts --compile
etsc --config=etsc.config.cjs
node --no-warnings=ExperimentalWarning --loader ts-node/esm ./src/pipeline/vue-sfc-compile.ts --clean
T="$(($(date +%s%3N)-T))"
echo "Build completed in ${T} MS!"