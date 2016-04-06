function merge(obj1, obj2) {
  var obj3 = {};
  for (k in obj1) { obj3[k] = obj1[k]; }
  for (k in obj2) { obj3[k] = obj2[k]; }
  return obj3;
}

module.exports = {
  merge
};
