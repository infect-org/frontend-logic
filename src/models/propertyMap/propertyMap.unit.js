import test from 'tape';
import PropertyMap from './propertyMap';

function createMap() {
    const map = new PropertyMap();
    const config1 = {
        property1: {
            translation: 'Property 1',
            valueTranslations: [
                { value: true, translation: 'truthy' },
                // Function for a single value
                { value: false, translation: () => 'falsy' },
            ],
        },
    };
    const config2 = {
        property1: {
            // Function for property
            translation: property => `${ property }_translated`,
            // Function for all values
            valueTranslations: (value) => {
                return `translated_${ value }`;
            },
        },
    };

    // Test if second param to valueTranslations (the whole entity) is correctly passed
    const config3 = {
        property5: {
            translation: (property) => property,
            valueTranslations: (value, entity) => entity.nameProperty
        }
    }

    const obj10 = {
        property1: true
    };
    const obj11 = {
        property1: false
        , property4: 'hidden'
    };
    const obj12 = {
        property1: true
    };
    const obj20 = {
        property1: true
        , property2: 'hidden'
    };
    const obj30 = {
        nameProperty: 'thisIsTheValue',
        property5: 3,
    }
    // Undefined property value: Should not be added to propertyMap
    const obj40 = {
        property1: undefined,
    };
    return {
        map,
        configs: [config1, config2, config3],
        objects: [obj10, obj11, obj12, obj20, obj30, obj40],
    };
}

test('throws if config is missing', (t) => {
    const { map, objects } = createMap();
    t.throws(() => map.addEntity('test', objects[0]), /provide a configuration/);
    t.end();
});

test('returns propertyMap', (t) => {
    const { map, objects, configs } = createMap();
    map.addConfiguration('testEntity', configs[0]);
    map.addEntity('testEntity', objects[0]);
    t.deepEquals(map.propertyValues.values, [ { 
        property: { 
            entityType: 'testEntity', 
            name: 'property1', 
            niceName: 'Property 1' 
        }
        , value: true
        , niceValue: 'truthy' 
    }]);
    t.end();
});


// Test properties 

test('adds entity if config is present', (t) => {
    const { map, configs, objects } = createMap();
    map.addConfiguration('testEntity', configs[0]);
    map.addEntity('testEntity', objects[0]);
    t.deepEqual(map.getPropertiesForEntityType('testEntity'), [{ entityType: 'testEntity', name: 'property1', niceName: 'Property 1' }]);
    t.end();
});

test('only adds values available', (t) => {
    const { map, configs, objects } = createMap();
    map.addConfiguration('testEntity', configs[0]);
    map.addEntity('testEntity', objects[1]);
    t.deepEqual(map.getPropertiesForEntityType('testEntity'), [{ entityType: 'testEntity', name: 'property1', niceName: 'Property 1' }]);
    // Does not contain property4
    t.end();
});

test('does not add undefined values', (t) => {
    const { map, configs, objects } = createMap();
    map.addConfiguration('testEntity', configs[0]);
    map.addEntity('testEntity', objects[5]);
    t.deepEqual(map.getPropertiesForEntityType('testEntity'), []);
    // Does not contain property4
    t.end();
});

test('accepts functions as property translations', (t) => {
    const { map, configs, objects } = createMap();
    map.addConfiguration('testEntity', configs[1]);
    map.addEntity('testEntity', objects[3]);
    t.deepEqual(map.getPropertiesForEntityType('testEntity'), [{ entityType: 'testEntity', name: 'property1', niceName: 'property1_translated' }]);
    t.end();
});


test('search', (t) => {
    const { map, configs, objects } = createMap();
    map.addConfiguration('testEntity', configs[0]);
    map.addEntity('testEntity', objects[0]);
    map.addEntity('testEntity', objects[1]);
    const expectation = map.getValuesForProperty('testEntity', 'property1')[0];
    t.deepEquals(map.search('truth'), [expectation]);
    t.end();
});


// Test values
test('translates values correctly', (t) => {
    const { map, configs, objects } = createMap();
    map.addConfiguration('entity0', configs[0]);
    map.addConfiguration('entity1', configs[1]);
    map.addEntity('entity0', objects[0]);
    map.addEntity('entity0', objects[1]);
    map.addEntity('entity1', objects[3]);
    const entity0values = map.getValuesForProperty('entity0', 'property1');
    t.equal(entity0values.length, 2);
    t.equal(entity0values[0].value, true);
    t.equal(entity0values[0].niceValue, 'truthy');
    t.equal(entity0values[1].niceValue, 'falsy');
    const entity1Values = map.getValuesForProperty('entity1', 'property1');
    t.equal(entity1Values.length, 1);
    t.equal(entity1Values[0].niceValue, 'translated_true');
    t.end();
});


test('translates values from entity', (t) => {
    const { map, configs, objects } = createMap();
    map.addConfiguration('entity1', configs[2]);
    map.addEntity('entity1', objects[4]); // Test valueTranslation from the whole entity
    const values = map.getValuesForProperty('entity1', 'property5');
    t.equal(values.length, 1);
    t.equal(values[0].niceValue, 'thisIsTheValue');
    t.end();
});
