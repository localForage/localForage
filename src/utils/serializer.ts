// Sadly, the best way to save binary data in WebSQL/localStorage is serializing
// it to Base64, so this is how we store it to prevent very strange errors with
import { fromByteArray, toByteArray } from 'base64-js';
import { logger } from './logger';

type BinaryData =
  | ArrayBuffer
  | Blob
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

const BLOB_TYPE_PREFIX = '~~local_forage_type~';
const BLOB_TYPE_PREFIX_REGEX = /^~~local_forage_type~([^~]+)~/;

const SERIALIZED_MARKER = '__lfsc__:';
const SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER.length;

// OMG the serializations!
const TYPE_ARRAYBUFFER = 'arbf';
const TYPE_BLOB = 'blob';
const TYPE_INT8ARRAY = 'si08';
const TYPE_UINT8ARRAY = 'ui08';
const TYPE_UINT8CLAMPEDARRAY = 'uic8';
const TYPE_INT16ARRAY = 'si16';
const TYPE_INT32ARRAY = 'si32';
const TYPE_UINT16ARRAY = 'ur16';
const TYPE_UINT32ARRAY = 'ui32';
const TYPE_FLOAT32ARRAY = 'fl32';
const TYPE_FLOAT64ARRAY = 'fl64';
const TYPE_SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER_LENGTH + TYPE_ARRAYBUFFER.length;

const asyncFileReader = (value: any) => {
  return new Promise<string>((resolve) => {
    // Convert the `Blob` to a binary array and then to a `String`.
    const fileReader = new FileReader();

    fileReader.onload = function() {
      // Backwards-compatible prefix for the `Blob` type.
      let bufferAsString;

      if (!this.result) {
        bufferAsString = '';
      } else if (this.result instanceof ArrayBuffer) {
        const resultAsBinaryArray = new Uint8Array(this.result);
        bufferAsString = fromByteArray(resultAsBinaryArray);
      } else {
        bufferAsString = this.result;
      }

      resolve(`${SERIALIZED_MARKER}${TYPE_BLOB}${BLOB_TYPE_PREFIX}${value.type}~${bufferAsString}`);
    };

    fileReader.readAsArrayBuffer(value);
  });
};

// Serialize a value, afterwards executing a callback (which usually
// instructs the `setItem()` callback/promise to be executed). This is how
// we store binary data with localStorage.
export const serialize = async (value: any): Promise<string> => {
  let valueType = '';
  if (value) {
    valueType = Object.prototype.toString.call(value);
  }

  if (
    value &&
    (value instanceof ArrayBuffer || (value.buffer && value.buffer instanceof ArrayBuffer))
  ) {
    // Convert binary arrays to a string and prefix the string with
    // a special marker.
    const buffer = value instanceof ArrayBuffer ? value : value.buffer;
    let marker = SERIALIZED_MARKER;

    if (value instanceof ArrayBuffer) {
      marker += TYPE_ARRAYBUFFER;
    } else {
      if (value instanceof Int8Array) {
        marker += TYPE_INT8ARRAY;
      } else if (value instanceof Uint8Array) {
        marker += TYPE_UINT8ARRAY;
      } else if (value instanceof Uint8ClampedArray) {
        marker += TYPE_UINT8CLAMPEDARRAY;
      } else if (value instanceof Int16Array) {
        marker += TYPE_INT16ARRAY;
      } else if (value instanceof Uint16Array) {
        marker += TYPE_UINT16ARRAY;
      } else if (value instanceof Int32Array) {
        marker += TYPE_INT32ARRAY;
      } else if (value instanceof Uint32Array) {
        marker += TYPE_UINT32ARRAY;
      } else if (value instanceof Float32Array) {
        marker += TYPE_FLOAT32ARRAY;
      } else if (value instanceof Float64Array) {
        marker += TYPE_FLOAT64ARRAY;
      } else {
        throw new Error('Failed to get type for BinaryArray');
      }
    }

    return `${marker}${fromByteArray(buffer)}`;
  } else if (value instanceof Blob) {
    return asyncFileReader(value);
  } else {
    try {
      return JSON.stringify(value);
    } catch (err) {
      logger.error("Couldn't convert value into a JSON string: ", value);

      throw err;
    }
  }
};

// Deserialize data we've inserted into a value column/field. We place
// special markers into our strings to mark them as encoded; this isn't
// as nice as a meta field, but it's the only sane thing we can do whilst
// keeping localStorage support intact.
//
// Oftentimes this will just deserialize JSON content, but if we have a
// special marker (SERIALIZED_MARKER, defined above), we will extract
// some kind of arraybuffer/binary data/typed array out of the string.
export const deserialize = (value: string): BinaryData => {
  if (value.substring(0, SERIALIZED_MARKER_LENGTH) !== SERIALIZED_MARKER) {
    // If we haven't marked this string as being specially serialized (i.e.
    // something other than serialized JSON), we can just return it and be
    // done with it.
    return JSON.parse(value);
  }

  // The following code deals with deserializing some kind of Blob or
  // TypedArray. First we separate out the type of data we're dealing
  // with from the data itself.
  let serializedString = value.substring(TYPE_SERIALIZED_MARKER_LENGTH);
  const type = value.substring(SERIALIZED_MARKER_LENGTH, TYPE_SERIALIZED_MARKER_LENGTH);

  let blobType;
  // Backwards-compatible blob type serialization strategy.
  // DBs created with older versions of localForage will not have the
  // blob type set in their serialization data.
  if (type === TYPE_BLOB) {
    const matcher = serializedString.match(BLOB_TYPE_PREFIX_REGEX);

    if (matcher) {
      blobType = matcher[1];
      serializedString = serializedString.substring(matcher[0].length);
    }
  }
  const buffer = toByteArray(serializedString);

  // Return the right type based on the code/type set during
  // serialization.
  switch (type) {
    case TYPE_ARRAYBUFFER:
      return buffer;
    case TYPE_BLOB:
      return new Blob([buffer], { type: blobType });
    case TYPE_INT8ARRAY:
      return new Int8Array(buffer);
    case TYPE_UINT8ARRAY:
      return new Uint8Array(buffer);
    case TYPE_UINT8CLAMPEDARRAY:
      return new Uint8ClampedArray(buffer);
    case TYPE_INT16ARRAY:
      return new Int16Array(buffer);
    case TYPE_UINT16ARRAY:
      return new Uint16Array(buffer);
    case TYPE_INT32ARRAY:
      return new Int32Array(buffer);
    case TYPE_UINT32ARRAY:
      return new Uint32Array(buffer);
    case TYPE_FLOAT32ARRAY:
      return new Float32Array(buffer);
    case TYPE_FLOAT64ARRAY:
      return new Float64Array(buffer);
    default:
      throw new Error('Unkown type: ' + type);
  }
};

const localforageSerializer = {
  serialize: serialize,
  deserialize: deserialize,
};

export default localforageSerializer;
