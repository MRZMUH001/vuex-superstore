export default function Superstate (options) {
  Object.assign(this, options)
}

Superstate.prototype = {

  name: '',

  reset: null,

  load: null,

  save: null,

  /**
   * Helper function to call module superstate
   *
   * @param  {String}   callbackName  the name of the callback to call
   * @param  {Object}   [state]       an optional input state to process
   * @return {Object}                 the updated state
   */
  call (callbackName, state) {
    const callback = this[callbackName]
    if (callback instanceof Function) {
      state = callback(state)
      if (state === null || typeof state !== 'object') {
        console.error(`[superstate] callback error: ${this.name}.${callbackName}() must return an Object`)
      }
    }
    return state
  }

}

