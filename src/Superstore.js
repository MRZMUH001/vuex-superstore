import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

/**
 * Vuex plugin to load, sync, reset and clear Vuex data from local storage
 *
 * @param   {Object}  storeDef  A Vuex store definition
 * @param   {Object}  options   A hash of options
 */
function Superstore (storeDef, options) {

  /**
   * Helper function to iterate over modules
   *
   * @param {Function}  callback
   */
  function each (callback) {
    names.forEach(name => callback(name, modules[name]))
  }

  /**
   * Load data from local storage and hydrate module states
   *
   * @returns {Object}            The updated modules
   */
  function load () {
    // load from local storage
    const states = JSON.parse(storage.getItem(key) || '{}')

    // update modules
    each((name, module) => {
      // initialize
      if (module.superstate) {
        module.superstate.name = name
        module.state = module.superstate.call(options.reset, module.state)
      }

      // add reset mutator
      if (module.mutations) {
        const reset = module.superstate && module.superstate.reset
        if (reset instanceof Function) {
          module.mutations[options.reset] = state => Object.assign(state, reset())
        }
      }

      // load
      const state = states[name]
      if (module.state && state) {
        Object.assign(module.state, module.superstate ? module.superstate.call('load', state) : state)
      }
    })
  }

  /**
   * Vuex mutation handler
   *
   * @param   {Object}  store     The store to save to local storage
   */
  function save (store) {
    store.subscribe((mutation, states) => {
      states = JSON.parse(JSON.stringify(states))
      each((name, module) => {
        let state = states[name]
        if (module.state && state) {
          states[name] = module.superstate
            ? module.superstate.call('save', state)
            : state
        }
      })

      // save states
      storage.setItem(key, JSON.stringify(states))
    })
  }

  /**
   * Commit to all modules
   *
   * @param type
   * @param payload
   */
  function commit (type, payload) {
    each((name, module) => {
      if (module.mutations) {
        const handler = module.mutations[type]
        if (handler instanceof Function) {
          return store.commit(name + '/' + type, payload)
        }
      }
    })
  }

  // assign methods
  Object.assign(this, {

    /**
     * Get a value from the store
     *
     * @param   {string}      path
     * @return  {*}
     */
    get (path) {
      if (path in store.getters) {
        return store.getters[path]
      }
      console.error(`[superstore] unknown getter type: '${path}'`)
    },

    /**
     * Set (commit) a value in the store
     *
     * @param   {String}      path
     * @param   {String}      value
     * @return  {Superstore}
     */
    set (path, value) {
      store.commit(path, value)
      return this
    },

    /**
     * Reset all module data and clear local storage
     */
    reset () {
      commit(options.reset)
      this.clear()
    },

    /**
     * Clear local storage data
     */
    clear () {
      storage.removeItem(key)
    },
  })

  // options
  options = Object.assign({
    reset: 'reset',
    key: 'vuex',
  }, options)

  // variables
  const key = options.key
  const modules = storeDef.modules
  const names = Object.keys(modules)
  const storage = window.localStorage

  // add save handler
  storeDef.plugins = [...storeDef.plugins, save]

  // load data
  load()

  // create store
  const store = this.store = new Vuex.Store(storeDef)
}

export default Superstore
