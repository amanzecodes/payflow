// Prisma's generated client uses explicit ".js" import specifiers (TS node16/nodenext
// convention), but in dev we run the ".ts" sources directly via ts-node with no build
// step, so those files don't exist. Fall back to the sibling ".ts" file when the literal
// ".js" path can't be resolved.
const Module = require('module')

const originalResolveFilename = Module._resolveFilename

Module._resolveFilename = function (request, ...rest) {
  if (request.endsWith('.js')) {
    try {
      return originalResolveFilename.call(this, request, ...rest)
    } catch (err) {
      return originalResolveFilename.call(this, request.slice(0, -3) + '.ts', ...rest)
    }
  }
  return originalResolveFilename.call(this, request, ...rest)
}
