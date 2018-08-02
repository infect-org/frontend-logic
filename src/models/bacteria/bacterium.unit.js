import test from 'tape';
import Bacterium from './bacterium';

test('initializes', (t) => {
	t.throws(() => new Bacterium(), /argument id/);
	t.throws(() => new Bacterium(14), /argument name/);
	t.doesNotThrow(() => new Bacterium(14, 'name'));
	t.end();
});

test('additional properties', (t) => {
	const bact = new Bacterium(14, 'name', { gram: 'gram+', aerobic: true });
	t.equals(bact.gram, 'gram+');
	t.end();
});

