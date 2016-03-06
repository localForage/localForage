function isWebSQLValid() {
    return typeof openDatabase === 'function';
}

export default isWebSQLValid;
