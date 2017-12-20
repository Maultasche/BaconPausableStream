const Bacon = require('baconjs');
const _ = require('lodash');

describe('testing the creation of pausable stream,', () => {
	jest.resetModules();
	
	const createPausableStream = require('../src/index');
	
	test('the stream works correctly without without any pausing or resuming', () => {		
		//Create the test data
		const testData = _.range(30);

		//Create the pausable stream that emits the test data
		const testStream = createTestPausableStream(testData);

		//Test the data streaming
		return testDataStreaming(testStream, testData);
	});

	test('the stream works correctly when it emits a single data item', () => {		
		//Create the test data
		const testData = _.range(1);

		//Create the pausable stream that emits the test data
		const testStream = createTestPausableStream(testData);
			
		//Test the data streaming
		return testDataStreaming(testStream, testData);	
	});
	
	test('the stream works correctly when it emits no data', () => {		
		//Create the test data
		const testData = [];

		//Create the pausable stream that emits the test data
		const testStream = createTestPausableStream(testData);
			
		//Test the data streaming
		return testDataStreaming(testStream, testData);
	});
	
	test('the stream creation function does not throw an error when the generator ' +
		'is a generator object', () => {
		function* testGenerator() {
			yield 1;
			
			return 2;
		}
		
		//Create a pausable stream using an array instead of a function and verify
		//that it throws an exception
		expect(() => createPausableStream(testGenerator())).not.toThrow();
	});
	
	test('the stream creation function throws an error when the generator ' +
		'object is actually a function', () => {
		//Create a pausable stream using a function instead of a 
		//generator object and verify that it throws an exception
		expect(() => createPausableStream(() => {})).toThrow();
	});
	
	test('the stream creation function throws an error when the generator ' +
		'object is actually a generator function', () => {
		function* testGenerator() {
			yield 1;
			
			return 2;
		}
		
		//Create a pausable stream using a generator function instead of a 
		//generator object and verify that it throws an exception
		expect(() => createPausableStream(testGenerator)).toThrow();
	});
	
	test('the stream creation function throws an error when the generator ' +
		'object is actually a normal object', () => {
		//Create a pausable stream using a normal object instead of a 
		//generator object and verify that it throws an exception
		expect(() => createPausableStream({})).toThrow();
	});
	
	test('the stream creation function throws an error when the generator ' +
		'object is actually an array', () => {
		//Create a pausable stream using a normal object instead of a 
		//generator object and verify that it throws an exception
		expect(() => createPausableStream([])).toThrow();
	});	
	
	test('the stream can be paused once with the stream initially unpaused', () => {
		return new Promise((resolve, reject) => {
			//Create the test data
			const testData = _.range(30);

			//Create the pausable stream that emits the test data
			const testStream = createTestPausableStream(testData);

			//Calculate the expected data
			const expectedData = testData.slice(0, 8);
			
			//Process the stream and collect the emitted data
			const actualData = [];
			
			expect.hasAssertions();
			
			let itemCount = 0;
					
			testStream.onError(error => reject(error));
			testStream.onValue(data => {
				itemCount = itemCount + 1;
				
				actualData.push(data);
				
				//Pause the stream after the eighth item
				if(itemCount === 8) {
					testStream.pause();

					//Since this stream will never end, set a timeout that will resolve the promise
					//and finish the test
					setTimeout(() => {
						expect(actualData).toEqual(expectedData);
						
						resolve();
					}, 100);				
				}
			});	
		});
	});
	
	test('the stream can be resumed once with the stream initially paused', () => {
		return new Promise((resolve, reject) => {
			//Create the test data
			const testData = _.range(30);

			//Create the pausable stream that emits the test data. The stream is initially
			//paused
			const testStream = createTestPausableStream(testData, true);

			//Keep track of whether we've resumed the stream yet
			let streamResumed = false;
			
			//Process the stream and collect the emitted data
			const actualData = [];
			
			expect.assertions(2);
			
			testStream.onError(error => reject(error));
			testStream.onValue(data => {
				actualData.push(data);
			});
			
			//Set a timeout to verify that the stream does not emit any values when paused
			setTimeout(() => {			
				//Verify that the stream is still paused
				expect(actualData.length).toBe(0);
				
				//Resume the stream
				testStream.resume();
			}, 100);

			
			testStream.onEnd(() => {
				//When the stream end, verify that we collected the expected data
				expect(actualData).toEqual(testData);

				resolve();
			});
		});
	});
	
	test('the stream can be paused and then resumed with the stream initially unpaused', () => {
		return new Promise((resolve, reject) => {
			//Create the test data
			const testData = _.range(30);

			//Create the pausable stream that emits the test data
			const testStream = createTestPausableStream(testData);

			//Calculate the expected data
			const expectedData = testData.slice(0, 12);
			
			//Process the stream and collect the emitted data
			const actualData = [];
			
			expect.hasAssertions();
			
			let itemCount = 0;
					
			testStream.onError(error => reject(error));
			testStream.onValue(data => {
				itemCount = itemCount + 1;
				
				actualData.push(data);
				
				//Pause the stream after the twelfth item
				if(itemCount === 12) {
					testStream.pause();

					//Since this stream will never end, set a timeout that will resolve the promise
					//and finish the test
					setTimeout(() => {
						//Verify that the expected data has been emitted
						expect(actualData).toEqual(expectedData);
						
						//Resume the stream
						testStream.resume();
					}, 100);				
				}
			});

			testStream.onEnd(() => {
				//When the stream end, verify that we collected the expected data
				expect(actualData).toEqual(testData);

				resolve();
			});
		});
	});	
	
	test('the stream can be resumed and then paused with the stream initially paused', () => {
		return new Promise((resolve, reject) => {
			//Create the test data
			const testData = _.range(30);

			//Create the pausable stream that emits the test data. The stream is initially
			//paused
			const testStream = createTestPausableStream(testData, true);

			//Calculate the expected data
			const expectedData = testData.slice(0, 15);
			
			//Keep track of whether we've resumed the stream yet
			let streamResumed = false;
			
			//Process the stream and collect the emitted data
			const actualData = [];
			
			expect.assertions(2);
			
			let itemCount = 0;
					
			testStream.onError(error => reject(error));
			testStream.onValue(data => {
				itemCount = itemCount + 1;
				
				actualData.push(data);
				
				//Pause the stream after the fifteenth item
				if(itemCount === 15) {
					testStream.pause();

					//Since this stream will never end, set a timeout that will resolve the promise
					//and finish the test
					setTimeout(() => {
						expect(actualData).toEqual(expectedData);
						
						resolve();
					}, 100);				
				}
			});	
			
			//Set a timeout to verify that the stream does not emit any values when paused
			setTimeout(() => {			
				//Verify that the stream is still paused
				expect(actualData.length).toBe(0);
				
				//Resume the stream
				testStream.resume();
			}, 100);
		});
	});
	
	test('the stream can be paused and resumed repeatedly', () => {
		return new Promise((resolve, reject) => {
			//Create the test data
			const testData = _.range(30);

			//Create the pausable stream that emits the test data
			const testStream = createTestPausableStream(testData);

			//Process the stream and collect the emitted data
			const actualData = [];
			
			expect.hasAssertions();
			
			let itemCount = 0;
					
			testStream.onError(error => reject(error));
			testStream.onValue(data => {
				itemCount = itemCount + 1;
				
				//Calculate the expected data
				const expectedData = testData.slice(0, itemCount);
				
				actualData.push(data);
				
				//Pause the stream every time
				testStream.pause();

				//Set a timeout function that will verify that no values were emitted
				//while paused and then resume the stream
				setTimeout(() => {
					//Verify that the expected data has been emitted
					expect(actualData).toEqual(expectedData);
					
					//Resume the stream
					testStream.resume();
				}, 10);				
			});

			testStream.onEnd(() => {
				//When the stream end, verify that we collected the expected data
				expect(actualData).toEqual(testData);

				resolve();
			});
		});
	});	
	
	test('the stream can be paused multipe times in a row without any unexpected effects', () => {
		return new Promise((resolve, reject) => {
			//Create the test data
			const testData = _.range(30);

			//Create the pausable stream that emits the test data
			const testStream = createTestPausableStream(testData);

			//Calculate the expected data
			const expectedData = testData.slice(0, 8);
			
			//Process the stream and collect the emitted data
			const actualData = [];
			
			expect.hasAssertions();
			
			let itemCount = 0;
					
			testStream.onError(error => reject(error));
			testStream.onValue(data => {
				itemCount = itemCount + 1;
				
				actualData.push(data);
				
				//Pause the stream after the eighth item
				if(itemCount === 8) {
					testStream.pause();

					//Set a timeout function to verify that the stream is paused
					setTimeout(() => {
						expect(actualData).toEqual(expectedData);
						
						//Pause the stream again
						testStream.pause();
						
						//Set another timeout function to verify that the stream
						//remains paused
						setTimeout(() => {
							testStream.pause();
							
							expect(actualData).toEqual(expectedData);
							
							resolve();
						}, 20);							
					}, 10);
				}
			});	
		});
	});
	
	test('the stream can be resumed multiple times in a row without any unexpected effects', () => {
		return new Promise((resolve, reject) => {
			//Create the test data
			const testData = _.range(30);

			//Create the pausable stream that emits the test data. The stream is initially
			//paused
			const testStream = createTestPausableStream(testData, true);

			//Keep track of whether we've resumed the stream yet
			let streamResumed = false;
			
			//Process the stream and collect the emitted data
			const actualData = [];
			
			expect.assertions(2);
			
			testStream.onError(error => reject(error));
			testStream.onValue(data => {
				actualData.push(data);
				
				//Resume the stream again
				testStream.resume();
			});
			
			//Set a timeout to verify that the stream does not emit any values when paused
			setTimeout(() => {			
				//Verify that the stream is still paused
				expect(actualData.length).toBe(0);
				
				//Resume the stream even though it is not paused
				testStream.resume();
			}, 10);

			
			testStream.onEnd(() => {
				//When the stream end, verify that we collected the expected data
				expect(actualData).toEqual(testData);

				resolve();
			});
		});
	});
	
	test('the stream works correctly when we use a generator that doesn\'t return ' +
		'anything', () => {		
		//Create the test data
		const testData = _.range(30);

		//This generator function doesn't return anything, which means that it returns
		//an undefined value
		function* generator() {
			for(item of testData) {
				yield item;
			}
		}
		
		//Create the pausable stream that emits the test data
		const testStream = createPausableStream(generator());

		//Add an undefined value to the end of the test data so that it matches
		//what the stream will produce
		const expectedData = [...testData, undefined];
		
		//Test the data streaming
		return testDataStreaming(testStream, expectedData);
	});
	
	test('the stream works correctly when we use a generator that returns ' +
		'Bacon.End before it has finished', () => {		
		//Create the test data
		const testData = _.range(30);

		//This generator function yields Bacon.End before it has finished
		function* generator() {
			for(item of testData) {
				if(item !== 21) {
					yield item;
				}
				else {
					yield new Bacon.End();
				}
			}
			
			return new Bacon.End();
		}
		
		//Create the pausable stream that emits the test data
		const testStream = createPausableStream(generator());

		//Add an undefined value to the end of the test data so that it matches
		//what the stream will produce
		const expectedData = _.range(21);
		
		//Test the data streaming
		return testDataStreaming(testStream, expectedData);
	});
	
	/**
	 * Tests the streaming of data from a pausable stream
	 *
	 * @param {Object} testStream - the pausable stream to be tested
	 * @param {Array.<*>} expectedData - an array of data that the stream
	 *	is expected to emit
	 * @returns a promise that resolves when the test has completed
	 */
	function testDataStreaming(testStream, expectedData) {
		return new Promise((resolve, reject) => {
			//Process the stream and collect the emitted data
			const actualData = [];
			
			expect.hasAssertions();
			
			testStream.onError(error => reject(error));
			testStream.onValue(data => actualData.push(data));
			
			testStream.onEnd(() => {
				//When the stream end, verify that we collected the expected data
				expect(actualData).toEqual(expectedData);
				
				resolve();
			});
		});				
	}
	
	/**
	 * Creates a pausable stream that emits the elements in an array of test data
	 *
	 * @param {Array.<*>} testData - an array of test data to be emitted
	 * @param {boolean} [initiallyPaused] - true if the stream is to be initially
	 *	paused, otherwise false. This parameter defaults to false.
	 * @returns a pausable stream that emits that test data
	 */
	function createTestPausableStream(testData, initiallyPaused = false) {
		//Create the pausable stream that emits the test data
		const testStream = createPausableStream(generateTestData(testData), 
			initiallyPaused);		
		
		return testStream;
	}
	
	/**
	 * This generator function emits test data, and serves to generate events for
	 * test Bacon streams
	 *
	 * @param {Array.<*>} testData - an array of test data to be emitted
	 */
	function* generateTestData(testData) {
		for (data of testData) {
			yield data;
		}

		return new Bacon.End();		
	}
});