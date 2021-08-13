const {Pool} = require('pg');

// Don't keep credentials in the source tree in a real app!
const pool = new Pool(require('../credentials'));

module.exports = pool;