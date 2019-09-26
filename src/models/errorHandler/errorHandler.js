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

// Export instance (we only need one across the whole app)
export default new ErrorHandler();
