export const isArray = Array.isArray
  ? Array.isArray
  : (variable: any): boolean => {
      return Object.prototype.toString.call(variable) === '[object Array]';
    };
