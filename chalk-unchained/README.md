# chalk-unchained

> [!NOTE]
>
> This project was once published to NPM with name `chalk-better` in around 2020, but now removed.

```javascript
// w/o
console.log(chalk.bgBlue.white.bold('Hello, world!'))

// with
chalkUnchained('Hello, world!', 'bgBlue white bold')
```

## Install

```shell
$ npm install chalk-unchained --save
```

## Usage

```javascript
const { chalkUnchained } = require('chalk-unchained')
chalkUnchained('your messgae', 'space seperated styles')

// Available styles include
// - bold, italic, underline, inverse
// - black, red, green, yellow, blue, magenta, cyan, white, gray
// - bgBlack, bgRed, bgYello, bgBlue,bgMagenta, bgCyan, bgWhite
```

## License

MIT

Highly dependent on [chalk](https://www.npmjs.com/package/chalk) .
