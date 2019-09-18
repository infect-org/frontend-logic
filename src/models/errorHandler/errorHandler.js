import { observable, action } from 'mobx';

class ErrorHandler {

    @observable errors = [];

    @action handle(err) {
        // Make sure errors are also propagated to online tools (that are mostly watching
        // console.error for output)
        console.error(err);
        this.errors.push(err);
    }

}

export default new ErrorHandler();
