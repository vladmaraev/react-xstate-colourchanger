//
//  srgs.js
//  Copyright (C) 2009, Peter Ljunglöf. All rights reserved.
//
/*
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published 
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  
  You should have received a copy of the GNU General Public License
  and the GNU Lesser General Public License along with this program.  
  If not, see <http://www.gnu.org/licenses/>.
*/


//////////////////////////////////////////////////////////////////////
// encoding SRGS grammars in javascript

export function Grammar(root) {
  this.$root = root;
  
  this.VOID = [OneOf([])];
  this.NULL = [];
  this.GARBAGE = []; 
  
  this.$check = function() {
    for (var i in this) {
      if (i !== "$root" && i !== "$check") {
	try {
	  checkSequenceExpansion(this[i]);
	} catch(err) {
	  throwRuleError("When checking grammar rule '" + i + "'", err);
	}
      }
    }
  }
}

export function WordSet(str) {
  var words = str.split(/ +/);
  var set = {};
  for (var i in words) {
    set[words[i]] = true;
  }
  return set;
}

//////////////////////////////////////////////////////////////////////
// rule expansion constructors

// sequences are ordinary arrays
export function Sequence(seq) {
  return seq;
}

export function Ref(ref) {
  return new RefClass(ref);
}

export function Tag(tag) {
  return new TagClass(tag);
}

export function OneOf(alternatives) {
  return new OneOfClass(alternatives);
}

export function Repeat(min, max, sequence) {
  return new RepeatClass(min, max, sequence);
}

export function Optional(sequence) {
  return new RepeatClass(0, 1, sequence);
}

//////////////////////////////////////////////////////////////////////
// rule expansion classes

export function RefClass(ruleref) {
  this.content = ruleref;
  this._string = "$" + ruleref;
  this.toString = function toString() {return this._string}
}
    
export function TagClass(tag) {
  this.content = tag;
  this._string = "{" + tag + "}";
  this.toString = function toString() {return this._string}
}

export function OneOfClass(alternatives) {
  this.content = alternatives;
  this._string = "(" + alternatives.join("|") + ")";
  this.toString = function toString() {return this._string}
}

export function RepeatClass(min, max, sequence) {
  this.min = min;
  this.max = max;
  this.content = sequence;
  this._string = this.content + "<" + this.min + "-" + (this.max==Infinity ? "" : this.max) + ">"
  this.toString = function toString() {return this._string}
}

//////////////////////////////////////////////////////////////////////
// checking rule expansions

export function throwRuleError(message, error) {
  if (error == undefined) {
    throw TypeError(message);
  } else {
    throw TypeError(message + "; " + error.message);
  }
}

export function checkSequenceExpansion(sequence) {
  try {
    if (sequence.constructor !== Array) {
      throwRuleError("Expected Array, found " + sequence.constructor.name);
    }
    for (var i in sequence) {
      if (sequence[i].constructor == Array) {
	checkSequenceExpansion(sequence[i]);
      } else if (sequence[i].constructor != String) {
	sequence[i].checkExpansion();
      }
    }
  } catch(err) {
    throwRuleError("When checking sequence expansion", err);
  }
};

RefClass.prototype.checkExpansion = function checkExpansion() {
  if (this.content.constructor !== String) {
    throwRuleError("When checking Ref content; Expected String, found " + this.content.constructor.name);
  }
};

TagClass.prototype.checkExpansion = function checkExpansion() {
  if (this.content.constructor !== String) {
      throwRuleError("When checking Tag content; Expected String, found " + this.content.constructor.name);
  }
};

OneOfClass.prototype.checkExpansion = function checkExpansion() {
  try {
    if (this.content.constructor !== Array) {
      throwRuleError("Expected Array, found " + this.content.constructor.name);
    }
    for (var i in this.content) {
      checkSequenceExpansion(this.content[i]);
    }
  } catch(err) {
    throwRuleError("When checking OneOf content", err);
  }
};

RepeatClass.prototype.checkExpansion = function checkExpansion() {
  try {
    if (this.min.constructor !== Number || this.max.constructor !== Number) {
      throwRuleError("Expected min/max to be Number, found " + this.min.constructor.name + "/" + this.max.constructor.name);
    }
    if (!(0 <= this.min && this.min <= this.max)) {
      throwRuleError("Expected 0 <= min <= max, found " + this.min + "/" + this.max);
    }
    checkSequenceExpansion(this.content);
  } catch(err) {
    throwRuleError("When checking Repeat content", err);
  }
};

