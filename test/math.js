// This is a comment! Look at me for directions!

const readline = require(`readline`); // Require input module
const rl = readline.createInterface({
    input: process.stdin, // Allow user to input strings
    output: process.stdout // Output replies in console
});

// wait function to add delay between certain lines (mostly for dramatic effect)
const sleep = (ms) => new Promise(resolve => { setTimeout(resolve, ms); });

/**
 * Get perfect dimensions with inputted x and y (width and length)
**/
async function getPerfectDimensions(x = 38.1, y = 50.8) {
  let newX = x;
  let newY = y;

  base10Iteration = 0.1;
  const perfectVolume = (5810 + 7000) / 2; // (min plus max) divided by 2 = average of min and max = perfect volume

  while (true) { // continue until max decimal precision is reached
    newX += base10Iteration;
    newY += base10Iteration;
    const newVolume = newX * newY * 3;
    const volume = x * y * 3; // get dimensions of prior iteration

    console.log(parseFloat(volume.toFixed(10)), perfectVolume, parseFloat(volume.toFixed(10)) === perfectVolume);

    if (volume > perfectVolume) { // if volume exceeds perfect volume
      console.log('Wait a minute... that\'s too big!');
      return;
    }

    else if (newVolume > perfectVolume) { // if current iteration's volume exceeds perfect volume
      newX = x; // update current iteration's dimensions
      newY = y;
      console.log('The perfect dimensions are', x, 'x', y, 'x', 3, '\nThe volume:', volume);
      base10Iteration /= 10;
      await sleep(150);
      console.log('\nWell, actually...');
      await sleep(500);
    }

    else if (newVolume === perfectVolume && parseFloat(volume.toFixed(12)) === perfectVolume) { // if current iteration's volume is equal to perfect volume
      await sleep(500);
      console.log('Nevermind, it is!');
      return; // stop
    }

    else {
      x = newX;
      y = newY;
    }
  }
}

rl.question("What is the width of the pan? ", function(width) {
  rl.question("What is the length of the pan? ", async function(length) {
    const x = parseFloat(width); // parse width input as number
    const y = parseFloat(length); // parse length input as number
    await getPerfectDimensions(
      isNaN(x) ? undefined : x, // if not a number, use default
      isNaN(y) ? undefined : y
    );
    rl.close();
  });
});