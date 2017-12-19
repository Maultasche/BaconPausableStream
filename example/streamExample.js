const createPausableStream = require('../src/index');
const _ = require('lodash');
const Bacon = require('baconjs');

//This creates a stream event generator that generates a series
//of numbers from 1 to maxNum.
function* createNumberGenerator(maxNum) {
	for(number of _.range(1, maxNum + 1)) {
		//Log a message when the event is generated so that we can see
		//that the stream is truly paused and not just buffering the generated
		//events
		console.log("Event generated: ", number);
		
		yield number;
	}
	
	return Bacon.End();
}

//Create a pausable stream that emits number 1 to 20
const numberStream = createPausableStream(createNumberGenerator(20));

//Map the number stream to a square stream, where each number is squared
const squareStream = numberStream.map(number => number * number);

let hasBeenPaused = false;

//Start outputting the values of the square stream, pausing when the squared number
//exceeds 30, and then resuming after 3 seconds. The pause will only happen once.
squareStream.onValue(square => {
	console.log("Square: ", square)
	
	//If the square is larger than 30 and the stream has not already been paused,
	//pause the stream and then resume it after 3 second
	if(square > 30 && !hasBeenPaused) {		
		//We can't pause the squareStream since it's a normal Bacon stream, but we can 
		//pause the source stream, which is numberStream.
		numberStream.pause();
		
		hasBeenPaused = true;
		
		setTimeout(() => numberStream.resume(), 3000);
	}
});
