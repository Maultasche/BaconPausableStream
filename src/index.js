const Bacon = require('baconjs');
 
/**
 * Creates a Bacon stream whose source is pausable. The resulting stream has pause() and 
 * resume() functions that allow the stream to be paused and resumed.
 *
 * The stream will end as soon as Bacon.End is returned or the generator finishes.
 *
 * The pause and resume functionality is only available on the stream that is created,
 * and not derived streams that are created from the initial stream using Bacon functions
 * such as map or reduce.
 *
 * The stream always starts out unpaused.
 *
 * @param {Object} - A generator object that will generate the events
 *	for the resulting stream.
 * @param {boolean} [initiallyPaused] - Controls whether the stream is initially paused
 *	after it has been created. This parameter defaults to false.
 * @returns a pausable and resumable Bacon stream that emits the events created by the
 *	generator object.
 */
function createPausableStream(generator, initiallyPaused = false) {
	//If the generator function is not an object, throw an error
	if(typeof generator !== 'object' || generator.next === undefined) {
		throw new Error('the generator is not a generator object');
	}
	
	//Keep track of whether the stream is currently paused or has ended
	let paused = null;
	let hasEnded = false;
	
	//Create a Bacon stream of boolean values that controls whether or not the 
	//main stream is paused. Also create a corresponding property that has
	//an initial pause value
	const pauseStream = new Bacon.Bus();
	const pauseProperty = pauseStream.toProperty(initiallyPaused);	
	
	//Wrap the generator in a function that will stop calling the generator
	//if the stream is paused
	const pausableStream = Bacon.fromBinder(sink => {
		//Whenever the pause property changes, react accordingly
		pauseProperty.onValue(pauseValue => {
			//Only do something if the pause value has changed
			if(paused !== pauseValue) {
				
				//Set the flag that indicates whether the stream is paused
				paused = pauseValue;

				//If the stream has been unpaused and it hasn't ended, 
				//start a recursive chain of generator function calls to
				//generate the stream values				
				if(!paused && !hasEnded) {
					repeatUntilPaused(() => {
						//Get the current value from the generator
						const currentValue = generator.next();

						//Emit the value
						sink(currentValue.value);
						
						if(currentValue.done) {
							//If this is the last value, indicate that the stream has ended
							hasEnded = true;
							
							//If the last value was *not* Bacon.End, emit Bacon.End
							if(isBaconEnd(currentValue.value)) {
								sink(new Bacon.End());
							}
						}					
						else if(isBaconEnd(currentValue.value)) {
							//If this is not the last value, but the value is Bacon.End, indicate
							//that the stream has ended
							hasEnded = true;
						}
					});
				}				
			}
		});			
	});
		
	//Create pause() and resume() functions on the stream object that push boolean
	//values to the pause stream
	pausableStream.pause = () => pauseStream.push(true);
	pausableStream.resume = () => pauseStream.push(false);	
	
	/**
	 * Indicates whether a value is a Bacon.End object
	 *
	 * @param {*} value - the value to be examined
	 * @returns true if the value is a Bacon.End object, otherwise false
	 */
	function isBaconEnd(value) {
		return value && typeof value.isEnd === 'function' && value.isEnd();
	}
	
	/**
	 * Asynchronously and recursively calls a callback function, repeating until
	 * the stream has been paused or it has come to an end.
	 *
	 * Since we are making recursive calls by putting an asynchronous function call
	 * on the Javascript event queue, we avoid issues with call stack overflows.
	 *
	 * @param func - the function to be called with zero parameters.
	 * @returns {Object} A promise that will be resolved with the next iteration
	 *	of the function call when the first function call has completed
	 */
	function repeatUntilPaused(func) {
		//We use an immediately resolved promise followed by a call to then() as 
		//a way to recurse asynchronously.
		return Promise.resolve()
			.then(() => {
				func();
				
				if(!paused && !hasEnded) {
					return repeatUntilPaused(func);
				}
			});
	}
	
	return pausableStream;	
}

module.exports = createPausableStream;