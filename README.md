Creates a Bacon stream that can pause the generation of stream events. This is useful when you want to actually pause the generation of events rather than buffer events that are still being generator.

For example, you could use this for preventing excessive memory use from the buffering of large numbers of rapidly-generated events when they cannot be processed quickly enough. Pause event generation when enough events have been generated and resume event generation when more events are needed.

## Creating a Pausable Bacon Stream

Pausable Bacon streams use ES6 generators to generate values. Creating a pausable Bacon stream can be done by passing a generator object that generates the events for the stream, like so:

```javascript
const Bacon = require('baconjs');
const createPausableStream = require('bacon-pausable-stream');

function* generateNumbers() {
	let currentNumber = 1;
	
	while(currentNumber <= 10) {
		yield currentNumber;
		
		currentNumber = currentNumber + 1;
	}
	
	return new Bacon.End();
}

//We call the generator function to product a generator object, passing it to
//createPausableStream.
const pausableStream = createPausableStream(generateNumbers());
```

Don't forget to call the generator function to product the generator object before passing it to createPausableStream().

The generator function yields event values and will end either when a Bacon.End object is yielded or returned or when the generator ends. Any Javascript value can be emitted including Bacon.Event objects. The data being emitted eventually ends up being passed to the sink callback passed by  Bacon.fromBinder(), so take a look at the Bacon.fromBinder() [documentation](https://baconjs.github.io/api.html#bacon-frombinder) for information about what sort of Bacon.Event values can be emitted. 

If the generator ends by returning another value, that value will be emitted as an event and the stream will immediately be ended after that. However, it's easy to forget to return anything.  Javascript functions return undefined by default, so if you have a generator function that doesn't return anything, you will see an event emitted with an undefined value followed by the end of the stream. Although returning a Bacon.End object to indicate the end of the stream is not required, I recommend doing so for the sake of clarity. 

## Pausing and Resuming

A pausable Bacon stream can be paused and resumed and at any time by calling the pause() and resume() functions on the stream object.

```javascript
pausableStream.pause();

pausableStream.resume();
```

Pausing the stream will stop events from being generated and the generator will not be called at all while a stream is paused. Resuming a stream will resume the calls to the generator function.

The Bacon API will allow stream events to be buffered instead of being emitted, but it cannot stop them from being generated. This can be a problem if very large amounts of events are being generated and they cannot be processed fast enough, since those events will back up in the buffer and can use a significant amount of memory while waiting to be processed. Pausing the stream by preventing the generation of those events will prevent that from happening. 

Calling pause() when the stream is already paused or resume() when the stream is not paused will have no effect, nor will either of those functions have any effect when the stream has ended.

The pause() and resume() functions are only available on the stream object that was created using createPausableStream(). They will not be available on any Bacon streams that are derived from the pausable stream, since those will be ordinary Bacon streams. So this means that you must have access to the original source stream in order to pause the generation of events.

So the following will result in an error.

```javascript
const pausableStream = createPausableStream(generator());

const lineStream = pausableStream
	.map(item => item + '\n')
	.onValue(line => {
		console.log(line);
		
		if(line.trim() == "") {
			lineStream.pause();
		}
	});
```

This code on the other hand, will work.

```javascript
const pausableStream = createPausableStream(generator());

const lineStream = pausableStream
	.map(item => item + '\n')
	.onValue(line => {
		console.log(line);
		
		if(line.trim() == "") {
			pausableStream.pause();
		}
	});
```

If you don't have access to the source stream when you need to pause the generation of events, you could try passing the pause and resume functions along with the data like this code.

```javascript
const pausableStream = createPausableStream(generator());

const lineStream = pausableStream
	.map(item => {
		return {
			line: item + '\n',
			pause: pausableStream.pause,
			resume: pausableStream.resume
		}
	)
	.onValue(lineItem => {
		console.log(lineItem.line);
		
		if(lineItem.line.trim() == "") {
			lineItem.pause();
		}
	});
```

Note that we don't need to bind the pause function to pausableStream when we create a direct reference of the function. Neither the pause() nor the resume() functions make use of the ```this``` context. They are just added onto the stream object to make them easy to access.

## Installing

Via npm:

```
npm install --save bacon-pausable-stream
```

Via yarn:

```
yarn add bacon-pausable-stream
```

## Example

An example file you can run, [streamExample.js](example/streamExample.js), can be found in the example directory. This example creates a generator that produces a series of numbers and streams them to a Bacon stream. The code maps the number stream to a stream that squares the numbers. Finally, the example pauses the stream once for three seconds when the squares exceed 30, and after the three seconds have expired, resumes the stream.

Along the way we output a message whenever a number is generated and then another message when the square stream emits a value. This way we can see that event generation is truly being paused instead of all the events being generated and then buffered.

You can run the example by running:

```
yarn streamExample
```
or

```
node example/streamExample.js
```

The initial output will look like this:

```
Event generated:  1
Square:  1
Event generated:  2
Square:  4
Event generated:  3
Square:  9
Event generated:  4
Square:  16
Event generated:  5
Square:  25
Event generated:  6
Square:  36
```

At this point, the stream will pause for three seconds. After the three seconds have ellapsed, the stream will be resumed with some more output:

```
Event generated:  7
Square:  49
Event generated:  8
Square:  64
Event generated:  9
Square:  81
Event generated:  10
Square:  100
Event generated:  11
Square:  121
Event generated:  12
Square:  144
Event generated:  13
Square:  169
Event generated:  14
Square:  196
Event generated:  15
Square:  225
Event generated:  16
Square:  256
Event generated:  17
Square:  289
Event generated:  18
Square:  324
Event generated:  19
Square:  361
Event generated:  20
Square:  400
```

## Running the Tests

After downloading, install the dependencies:

```yarn install```


Then run the automated tests:

 ```yarn test```

## License

This package is licensed under the MIT license.