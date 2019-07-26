import { observable, action } from 'mobx';
import debug from 'debug';

const log = debug('infect:ErrorHandler');

class ErrorHandler {

    @observable errors = [];

    @action handle(err) {
        log('Handle error %o', err);
        this.errors.push(err);
    }

}

export default new ErrorHandler();
