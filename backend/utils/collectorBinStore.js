let binsState = null;
function setBinsState(bins) { binsState = Array.isArray(bins) ? bins.map((b) => ({ ...b })) : null; }
function getBinsState() { return binsState ? binsState.map((b) => ({ ...b })) : null; }
module.exports = { setBinsState, getBinsState };
