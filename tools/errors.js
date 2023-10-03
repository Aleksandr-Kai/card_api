function getErrorText(error) {
	return (error && (error.message || error)) || "Unknown error";
}

module.exports = { getErrorText };
