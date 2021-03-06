  var bcrypt_alphabet = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  var valueSplit = function(bignum) {
    var self = {};
    self.take = function(N) {
      mod = bignum.remainder(N)
      bignum = bignum.divide(N)
      return parseInt(mod.toString(), 10);
    };
    self.choice = function(letters) {
      return letters[self.take(letters.length)];
    };
    return self;
  };

  var convertBase = function(result, alphabet) {
    var mul = BigInteger(1);
    var total = BigInteger(0);
    for (var k = result.length-1; k >= 0; k--) {
      // Work out this digits index in the alphabet
      var v = alphabet.indexOf(result.charAt(k));
      // Add it to the total, by the column multiple
      total = total.add(mul.multiply(v));
      // Multiply column multiple, by alphabet length
      mul = mul.multiply(alphabet.length);
    }
    return total;
  }

  var generateSalt = function(password, site) {

    var bignum = BigInteger(0);

    var result = hex_hmac_md5(password, site);

    var bignum = convertBase(result, "0123456789abcdef");

    var splitter = valueSplit(bignum);

    salt = "";
    for (var k = 0; k < 22; k++) {
      salt += splitter.choice(bcrypt_alphabet);
    }

    return salt;
  };

  exports.passwordly.generatePassword = function(password, site, callback) {
    var letters     = 'abcdefghijklmnopqrstuvwxyz';
    var u_letters   = letters.toUpperCase();
    var all_letters = letters + u_letters;

    var numbers = '0123456789',
        symbols = '!@#$%*-?+=',
        length = 10;

    var salt = '$2a$11$' + generateSalt(password, site);

    var bcrypt = new bCrypt();
    bcrypt.hashpw(password, salt, function(result) {
      var hash = result.substring(salt.length);
      var bignum = convertBase(hash, bcrypt_alphabet);

      var splitter = valueSplit(bignum);

      // Create the final letters first
      var output = [];
      for (var n = 0; n < length-1; n++) {
        output.push(null);
      }

      // Pick atleast one of each group for the rest
      var groups = [letters, u_letters, numbers, symbols];

      for (var k=0; k < groups.length; k++) {
        // Find all remaining options
        var options = [];
        for (var j = 0; j < output.length; j++) {
          if (output[j] === null) options.push(j);
        }

        // Pick one of the remaining positions for this group
        var index = splitter.choice(options);

        // Insert a choice from the group in the position
        output[index] = splitter.choice(groups[k]);
      }

      // Fill in remaining blanks with any group
      for (var k = 0; k < output.length; k++) {
        if (output[k] === null) {
          output[k] = splitter.choice(groups.join(""))
        }
      }

      // Pick a letter for the front
      var front = splitter.choice(letters+u_letters);

      // ... and you have your password!
      callback(front + output.join(""));
    }, function() {});
  };
})(typeof exports !== 'undefined' ? exports : this);
