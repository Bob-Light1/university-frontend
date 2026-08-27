/**
 * @file downloadBlob.js
 * @description Saves a binary axios response to the user's disk, and reads the
 * error message out of a failed one.
 *
 * The three-line "create an object URL, click a hidden anchor, revoke" dance is
 * written out in ten places in this codebase already. This helper exists so the
 * eleventh (the fee receipt) is not another copy, and so the two things every
 * copy gets wrong are fixed in one place:
 *
 *   - **the file name**: each copy invents its own, ignoring the
 *     `Content-Disposition` the server sent. The server is the one that knows
 *     the business identifier (a receipt number, a job's file name), so it is
 *     read here and the caller's name is only a fallback;
 *   - **the error**: with `responseType: 'blob'`, a 404 body arrives as a Blob
 *     containing JSON, so `err.response.data.message` is `undefined` and every
 *     copy falls back to a hard-coded English sentence. {@link readBlobError}
 *     parses it back.
 *
 * Existing call sites are deliberately left alone — migrating them is a cleanup
 * of its own, not a side effect of shipping a receipt.
 */

/** Reads the `filename="…"` of a Content-Disposition header, or null. */
const filenameFromDisposition = (disposition) => {
  if (!disposition) return null;
  // RFC 5987 form first (filename*=UTF-8''…), then the plain quoted form.
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8) { try { return decodeURIComponent(utf8[1]); } catch { /* fall through */ } }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1] : null;
};

/**
 * Triggers a browser download for a binary axios response.
 *
 * @param {import('axios').AxiosResponse} response  response fetched with `responseType: 'blob'`
 * @param {object} [options]
 * @param {string} [options.fallbackName]  used only when the server sent no file name
 * @param {string} [options.type]          MIME type, when the response carries none
 */
export const saveBlobResponse = (response, { fallbackName = 'download', type } = {}) => {
  const mime = type || response.headers?.['content-type'] || 'application/octet-stream';
  const name = filenameFromDisposition(response.headers?.['content-disposition']) || fallbackName;

  const url = URL.createObjectURL(new Blob([response.data], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  // Appended before clicking: a detached anchor is ignored by Firefox.
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoked on the next tick rather than synchronously: Safari aborts a download
  // whose object URL is released in the same task as the click.
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return name;
};

/**
 * Extracts the API's message from a failed binary request.
 *
 * @param {Error} error  the rejected axios error
 * @returns {Promise<string|null>} the server's `message`, or null when the
 *   response was not a readable JSON envelope (network failure, opaque body).
 */
export const readBlobError = async (error) => {
  const data = error?.response?.data;
  if (!data) return null;
  try {
    const text = typeof data.text === 'function' ? await data.text() : String(data);
    return JSON.parse(text)?.message ?? null;
  } catch {
    return null;
  }
};

export default saveBlobResponse;
