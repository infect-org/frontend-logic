import { observable, action } from 'mobx';

class ErrorHandler {

    @observable errors = [];

    //constructor() {
        /* global window */
        /*window.addEventListener('error', (err) => {
            this.handleError(err);
        });*/

        // const a = null;
        // console.log(a.abc);

    //}

    @action handle(err) {
        this.errors.push(err);
    }

}

export default new ErrorHandler();
