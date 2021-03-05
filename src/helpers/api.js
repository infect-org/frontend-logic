// https://babeljs.io/docs/usage/polyfill/
// Tests throw ReferenceError: regeneratorRuntime is not defined if we don't include the polyfill
// import 'babel-polyfill';

/**
* Wrapper for fetch API requests.
* @param {String} url           See fetch function
* @param {Object} options       See fetch function
* @param {Array} validStates    If states outside of [200–299] are valid, you can pass them in;
*                               they will be handled regularily.
*/
async function fetchApi(url, options, validStates = []) {

    /* global fetch */
    const response = await fetch(url, options);
    if (
        (response.status < 200 || response.status >= 300) &&
        validStates.indexOf(response.status) === -1
    ) {
        const responseText = await response.text();
        const err = new Error(`fetchApi: Calling ${url} returned invalid HTTP status ${response.status},
            content is ${responseText}.`);
        err.name = 'HTTPStatusError';
        throw err;
    }
    const data = await response.json();
    return {
        status: response.status,
        data,
    };

}

export { fetchApi };
