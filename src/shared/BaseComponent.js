import { Component } from 'react';

function nonCoreMethods(method) {
  // If a method is a core method, then do not bind it again.
  let whiteList = [
    'constructor',
    'render',
    'componentWillMount',
    'componentDidMount',
    'componentWillReceiveProps',
    'componentWillUpdate',
    'shouldComponentUpdate',
    'componentWillUnmount'
  ];
  return whiteList.indexOf(method) < 0;
}

export default class BaseComponent extends Component {
  static NOOP = function() {};
  constructor(...args) {
    super(...args);
    this.__originalSetState = this.setState;
    this.setState = this.__setState.bind(this);
  }
  // Bind all methods to class instance
  autoBind(proto) {
    let methods = Object.getOwnPropertyNames(
      proto || this.constructor.prototype
    ).filter(prop => typeof this[prop] === 'function');

    methods.filter(nonCoreMethods).forEach(method => {
      this[method] = this[method].bind(this);
    });
  }

  UNSAFE_componentWillMount() {
    this.__mounted = true;
  }

  componentWillUnmount() {
    this.__mounted = false;
  }

  __setState(...args) {
    if (this.__mounted) {
      this.__originalSetState(...args);
    }
  }
}
