Creates a Bacon stream that can pause the generation of stream events. This is useful when you want to actually pause the generation of events rather than buffer events that are still being generator.

For example, you could use this for preventing excessive memory use from the buffering of large numbers of rapidly-generated events when they cannot be processed quickly enough. Pause event generation when enough events have been generated and resume event generation when more events are needed..

Creating a pausable Bacon stream can be done by passing a generator function that generates the
events for the stream, like so:

```javascript
const Bacon = require('baconjs');
const createPausableStream = require('bacon-pausable-stream');

let currentNumber = 1;

const pausableStream = createPausableStream(() => {
	if(currentNumber < 10) {
		currentNumber++;
		
		return currentNumber;
	}
	else {
		return new Bacon.End();
	}
});
```

The generator function returns the next event value, which can sometimes involve a closure to keep track of the previous value. When there are no more values to be generated, return a Bacon.End object to indicate the end of the stream. The values that can be returned from this generator function are the same that are passed to the sink() function in Bacon.fromBinder(). See the Bacon.fromBinder() documentation for more information on what can be put into a stream.

The stream will end either when Bacon.End is yielded or returned or when the generator ends. If the generator ends by returning another value, that value will be emitted as an event and the stream will immediately be ended after that. Note that Javascript functions return undefined by default, so if you have a generator function that doesn't return anything, you will see an event emitted with an undefined value followed by the end of the stream.


- test passing Bacon.End in the middle of a generator rather than at the end
- test using a generator that doesn't return anything (undefined)


## Installing

Via npm:

```
npm install --save bacon-node-autopause-line-stream
```

Via yarn:

```
yarn add bacon-node-autopause-line-stream
```

## Using

Here's an example of creating a readable stream from a file and then converting that to a Bacon stream.

```javascript
const createLineStream = require('bacon-node-autopause-line-stream');
const fs = require('fs');

//Create a autopause bacon line stream
const lineStream = createAutoPauseLineStream(readStream);

//Create an error handler
lineStream.onError(error => console.error(error));

//Output the lines from the text file
lineStream.onValue(({line, resume}) => {
	//Output the line of text
	console.log(line);

	//Tell the stream to resume so that it will emit more lines
	resume();
});
```

## Running the Example

After downloading the source, you can run an example which reads from a file and outputs the contents of that file line by line:

```
yarn fileExample example/textFile.txt
```

This command runs the example/fileExample.js file and passes it the text file to read from.

You can replace "example/textFile.txt" with any text file. For example, we could output the example source file:

```
yarn fileExample example/fileExample.js
```

## Running the Tests

After downloading, install the dependencies:

```yarn install```


Then run the unit tests:

 ```yarn test```

## License

This package is licensed under the MIT license.