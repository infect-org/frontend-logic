import test from 'tape';
import InfectApp from './infectApp';
import fetchMock from 'fetch-mock';
import testData from './infectApp.testData';


function getConfig() {
	return {
		endpoints: {
			apiPrefix: '/'
			, bacteria: 'bacterium'
			, antibiotics: 'antibiotic'
			, resistances: 'resistance'
			, substanceClasses: 'substanceclasses'
		}
	};
}


function getData(type) {



}

/*test('handles errors', (t) => {
	fetchMock.mock('/bacterium', 409);
	fetchMock.mock('/antibiotic', 200);
	fetchMock.mock('/resistance', 200);
	fetchMock.mock('/substanceclasses', 200);
	const app = new InfectApp(getConfig());
	app.getDataPromise.catch((err) => {
		// Throws – handling needed
		t.equal(err.message.indexOf('409') > -1, true);
		fetchMock.restore();
		t.end();
	});
});


test('handles data correctly', (t) => {

	fetchMock.mock('/bacterium', { status: 200, body: testData.bacteria });
	fetchMock.mock('/antibiotic', { status: 200, body: testData.antibiotics });
	fetchMock.mock('/resistance', { status: 200, body: testData.resistances });
	fetchMock.mock('/substanceclasses', { status: 200, body: testData.substanceClasses });

	const app = new InfectApp(getConfig());
	app.getDataPromise.then(() => {
		//console.log(app.resistances);
		t.equal(app.bacteria.getAsArray().length, 2);
		t.equal(app.resistances.getAsArray().length, 2);
		t.equal(app.antibiotics.getAsArray().length, 2);
		t.equal(app.substanceClasses.getAsArray().length, 3);
		fetchMock.restore();
		t.end();
	}, (err) => {
		t.fail(err);
		t.end();
	});

});*/