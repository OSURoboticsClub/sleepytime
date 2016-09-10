'use strict';

exports.validate = (name, opt) => {
  if (typeof opt === 'undefined') {
    throw "Error: Packet '" + name + "' cannot be undefined";
  }

  return opt;
}

exports.sanitize = (value) => {
  this.value = value;

  this.otherwise = (equals) => {
    if (typeof this.value === 'undefined') {
      return equals;
    } else {
      return value;
    }
  }

  return this;
}
