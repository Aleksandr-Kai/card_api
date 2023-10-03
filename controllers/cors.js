function cors(request, response, next) {
	response.setHeader("Access-Control-Allow-Origin", "*");
	if (request.method === "OPTIONS") {
		console.log(`Response CORS OPTIONS: ${request.path}`);
		response.setHeader("Content-Type", "text/html; charset=UTF-8");
		response.setHeader("Access-Control-Max-Age", "86400");
		response.setHeader("Access-Control-Allow-Methods", "PUT,PATCH,DELETE");
		response.setHeader(
			"Access-Control-Allow-Headers",
			"API-Key,Content-Type,If-Modified-Since,Cache-Control,authorization"
		);
		response.sendStatus(200);
	} else next();
}

module.exports = { cors };
