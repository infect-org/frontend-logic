import test from 'tape';
import fetchMock from 'fetch-mock';
import {fetchApi} from './api';


test('throws on invalid states', (t) => {
	fetchMock.mock('/api', { status: 404, body: 'nope' });
	fetchApi('/api')
		.then(() => {}, (err) => {
			t.equal(err.name, 'HTTPStatusError');
			t.equal(err.message.indexOf('invalid HTTP status 404') > -1, true);
			// Reads content from request
			t.equal(err.message.indexOf('nope') > -1, true);
			fetchMock.restore();
			t.end();
		});
});



test('returns data on success', (t) => {
	const body = { success: true };
	fetchMock.mock('/api', {
		status: 200
		, body
	});
	fetchApi('/api')
		.then((response) => {
			t.equal(response.status, 200);
			t.deepEqual(response.data, body);
			fetchMock.restore();
			t.end();
		});
});



test('throws on invalid JSON', (t) => {
	const body = '{ success: true';
	fetchMock.mock('/api', {
		status: 200
		, body
	});
	fetchApi('/api')
		.then(() => {}, (err) => {
			t.equal(err instanceof Error, true);
			fetchMock.restore();
			t.end();
		});
});



test('passes options to fetch', (t) => {
	const headers = {
		'accept': 'application/json'
	};
	const body = { success: true };
	fetchMock.mock('/api', {
		status: 200
		, body
	});
	fetchApi('/api', { headers })
		.then(() => {
			t.equal(fetchMock.called('/api'), true);
			t.deepEqual(fetchMock.lastOptions('/api'), { headers });
			fetchMock.restore();
			t.end();
		});
});



test('succeeds on passed status codes', (t) => {
	const body = { success: true };
	fetchMock.mock('/api', {
		status: 409
		, body
	});
	fetchApi('/api', {}, [409])
		.then((response) => {
			t.equal(response.status, 409);
			fetchMock.restore();
			t.end();
		});
});

