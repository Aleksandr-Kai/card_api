function isInteger(...values) {
	for (let i = 0; i < values.length; i++)
		if (!Number.isInteger(values[i])) {
			return false;
		}
	return true;
}

module.exports = { isInteger };
