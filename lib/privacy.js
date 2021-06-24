function strip_paths(stackTrace) {
  let newStack = []
  for (let s of stackTrace) {
    // Replace paths in (/path/to/src:linenumber:something) with just last component of path.
    // Account for linux paths and windows paths.
    newStack.push(s.replace(/\(.*\/([^/:]*)/, "($1").replace(/\(.*\\([^\\:]*)/, "($1"));
  }
  return newStack;
}

module.exports = {
  strip_paths,
};