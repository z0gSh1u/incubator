# chalk-better

```javascript
// w/o chalk-better
console.log(chalk.bgBlue.white.bold('Hello, world!'))

// with chalk-better
chalkBetter("Hello, world!", 'bgBlue white bold')
```

## Install

### via npm

```shell
$ npm install chalk-better --save
```

### via source

```shell
$ git clone https://github.com/z0gSh1u/chalk-better.git
```

And then copy `app.js` and `app.d.ts` to your project as you wish.

## Usage

```javascript
const { chalkBetter } = require('chalk-better')
chalkBetter('your messgae', 'space seperated styles')
```

**Available styles:**

- bold, italic, underline, inverse
- black, red, green, yellow, blue, magenta, cyan, white, gray
- bgBlack, bgRed, bgYello, bgBlue,bgMagenta, bgCyan, bgWhite

## License

MIT

Highly dependent on [chalk](https://www.npmjs.com/package/chalk) .
