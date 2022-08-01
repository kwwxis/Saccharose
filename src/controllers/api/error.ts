// We export a factory function instead of the class itself because the `new` keyword doesn't
// work in front of the `require` function.

export class APIError extends Error {
  code: any;

  /**
   * Construct a `BAD_REQUEST` APIError.
   *
   * @param {string} message the optional error message for the `error_description` property
   * @param {string} code the optional code for the `error_code` property
   */
  constructor(message = undefined, code = undefined) {
    super(message);
    this.name = "APIError";
    this.code = code;
  }
}

/**
 * Returns a new `BAD_REQUEST` APIError.
 *
 * @param {string} message the optional error message for the `error_description` property
 * @param {string} code the optional code for the `error_code` property
 * @returns {APIError}
 */
export default function(message = undefined, code = undefined) {
  return new APIError(message, code);
};

export const cls = APIError;