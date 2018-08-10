import { observable, action } from 'mobx';

class ErrorHandler {

    @observable errors = [];

    @action handle(err) {
        this.errors.push(err);
    }

}

export default new ErrorHandler();
