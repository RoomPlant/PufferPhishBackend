class Analizer {
	analize = (message: any) => {
		return [this.analizeForSpoofing(message.parts[0].body["authentication-results"])].every(Boolean)
	}

	private analizeForSpoofing = (authResult: any) => {
		return authResult ? authResult[0].indexOf("dkim=pass") + 1 : false
	}
}

export default Analizer