const Bacon = require('baconjs');

/**
 * This is the same as the sink() function that is passed to Bacon.fromBinder. See
 * the Bacon.js API documentation for more details.
 * @callback BaconSink
 * @param {Bacon.Event|*} event - A Bacon event object or the value to be emitted in the
 * 	resulting event stream
 */
 
/**
 * This function 
 * is exactly the same generator function that would be passed to Bacon.fromBinder().
 * It gets called to generate events that are emitted in the resulting stream. See the
 * description of Bacon.fromBinder in the Bacon.js API documentation for more information.
 * @callback GeneratorFunction
 * @return
 */

 
/**
 * Creates a Bacon stream whose source is pausable. This function works just like
 * Bacon.fromBinder() where a function is passed to it that generates stream
 * events. The only difference is that the resulting stream has pause() and 
 * resume() functions that allow the stream to be paused and resumed.
 *
 * The pause and resume functionality is only available on the stream that is created,
 * and not derived streams that are created from the initial stream using Bacon functions
 * such as map or reduce.
 *
 * The stream always starts out unpaused.
 *
 * @param {GeneratorFunction} - A Bacon generator function that will generate the events
 *	for the resulting stream. This is the same callback function that is passed to 
 *	Bacon.fromBinder().
 * @param {boolean} [initiallyPaused] - Controls whether the stream is initially paused
 *	after it has been created. This parameter defaults to false.
 * @returns a pausable and resumable Bacon stream that emits the events created by the
 *	generator function.
 */
function createPausableStream(generatorFunction, initiallyPaused = false) {
	//If the generator function is not a function, throw an error
	if(typeof generatorFunction !== 'function') {
		throw new Error('generatorFunction is not a function');
	}
	
	//Keep track of whether the stream is currently paused or has ended
	let paused = null;
	let hasEnded = false;
	
	//Create a Bacon stream of boolean values that controls whether or not the 
	//main stream is paused. Also create a corresponding property that has
	//an initial pause value
	const pauseStream = new Bacon.Bus();
	const pauseProperty = pauseStream.toProperty(initiallyPaused);	
	
	//Wrap the generator function in a function that will stop calling the generator
	//function if the stream is paused
	const pausableStream = Bacon.fromBinder(sink => {
		//Wrap the sink callback in our own callback so that we can detect when
		//the stream has ended when sink() is passed a Bacon.End event
		const pauseSink = streamEvent => {
			//If this event is an End event, set the flag that indicates that the
			//stream has ended
			if(streamEvent.isEnd && streamEvent.isEnd()) {
				hasEnded = true;
			}

			//Pass the event onto the Bacon sink function
			sink(streamEvent);
		}
		
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
					repeatUntilPaused(() => pauseSink(generatorFunction()));
				}				
			}
		});			
	});
		
	//Create pause() and resume() functions on the stream object that push boolean
	//values to the pause stream
	pausableStream.pause = () => pauseStream.push(true);
	pausableStream.resume = () => pauseStream.push(false);	
	
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