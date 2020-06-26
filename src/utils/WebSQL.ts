export const isWebSQLValid = (): boolean => {
  return (
    (typeof window !== 'undefined' && !!window.openDatabase) ||
    (typeof self !== 'undefined' && !!self.openDatabase)
  );
};

export default isWebSQLValid;
