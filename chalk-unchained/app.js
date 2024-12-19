/**
 * chalk-better v1.0.0
 * https://github.com/z0gSh1u/chalk-better
 */

const chalk = require('chalk')

module.exports.chalkBetter = function (message, style) {
  try {
    // wtf is this string!
    eval(
      `console.log(${
        style && style.trim() ? `chalk.${style.split(/\s+/).join('.')}(` : ''
      }'${message}'${style && style.trim() ? ')' : ''})`
    )
  } catch (e) {
    throw new Error('Bad chalk style.')
  }
}
