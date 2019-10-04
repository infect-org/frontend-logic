import { observable, action } from 'mobx';
import debug from 'debug';

const log = debug('infect:ErrorHandler');

class ErrorHandler {

    @observable errors = [];

    @action handle(err) {
        // Make sure errors are also propagated to online tools (that are mostly watching
        // console.error for output)
        console.error('Handle error %o', err);
        this.errors.push(err);
    }

}

// Do NOT export instance (that would therefore act as a «singleton») as it makes testing very
// hard.
export default ErrorHandler;
