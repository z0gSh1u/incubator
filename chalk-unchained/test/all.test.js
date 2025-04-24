const { chalkUnchained } = require('../app')

describe('all', () => {
  test('never throw', () => {
    expect(() => {
      chalkUnchained('Hello, world!', 'bgBlue white bold')
    }).not.toThrow()
  })

  test('always throw', () => {
    expect(() => {
      chalkUnchained('Hello, world!', 'bgBlue~white+bold')
    }).toThrow()
  })
})
