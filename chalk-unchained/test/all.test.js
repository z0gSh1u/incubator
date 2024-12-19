const { chalkBetter } = require('../app')

describe('all', () => {
  test('never throw', () => {
    expect(() => {
      chalkBetter('Hello, world!', 'bgBlue white bold')
    }).not.toThrow()
  })

  test('always throw', () => {
    expect(() => {
      chalkBetter('Hello, world!', 'bgBlue~white+bold')
    }).toThrow()
  })
})
