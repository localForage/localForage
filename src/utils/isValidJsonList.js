/** Function to validate json object list with structure
 * structure : {key : <any>, value : <any>}
 * return true(not valid) or false(valid)
 */
function isValidJsonList(list) {
    if (!list || ['string', 'undefined', 'number'].indexOf(typeof list) + 1) {
        return true;
    }
    for (let i = 0; i < list.length; i++) {
        if (
            !('key' in list[i]) ||
            !('value' in list[i]) ||
            list[i].hasOwnProperty('length')
        ) {
            return true;
        }
    }
    return false;
}

export default isValidJsonList;
