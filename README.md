# BaconPausableStream
Creates a Bacon stream that can pause the generation of stream events, preventing excessive memory use from buffering of those events when they cannot be processed quickly enough


Test:
- Make sure that the stream just works correctly without any pausing or resuming
- Test that we can pause the stream once with the stream initially unpaused
- Test that we can resume the stream once with the stream initially paused
- Test that we pause and then resume the stream with the stream initially unpaused
- Test that we can resume and then pause the stream with the stream initally paused
- Test that we can pause and resume the stream repeatedly
- Test that we can pause the stream twice in a row without any unexpected effects
- Test that we can resume the stream twice in a row without any unexpected effects
