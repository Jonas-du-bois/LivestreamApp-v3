const { normalize } = require('path');
console.log(normalize('/Api/admin'));
console.log(normalize('/api/admin/login').startsWith('/api/admin'));
