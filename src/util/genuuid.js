const cryptoGetRandomValues = require('get-random-values');

// This file must be JS instead of TS due to syntax compatibility issues.

module.exports = function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ cryptoGetRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
};