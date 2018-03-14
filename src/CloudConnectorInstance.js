/*
 * Promise based access to the Cloud Connector API, very low level (only json parsing)
 */

const fetch = require('node-fetch');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
 
class CloudConnectorInstance {
	constructor(data) {
		this.url = data.url;
		this.user = data.user;
		this.password = null;
	}
  
	_getBaseUrl() {
		return this.url;
	}
	
	_getApiUrl() {
		return this._getBaseUrl() + "/api/v1/configuration/";
	}
	
	_getEndocedUserAndPassword() {
		return Buffer.from(`${this.user}:${this.password}`).toString('base64');
	}
	
	_getBasicAuthHeader() {
		return `Basic ${this._getEndocedUserAndPassword()}`;
	}
	
	post(endpoint, body, contenttype, isAbsolute) {
		let url = (isAbsolute ? this._getBaseUrl() : this._getApiUrl() ) + endpoint;
		return fetch(url, {method: 'POST', body: body, headers: {'Authorization': this._getBasicAuthHeader(), 'Content-Type': contenttype}, redirect: 'manual'});
	}
	
	get(endpoint, isAbsolute) {
		let url = (isAbsolute ? this._getBaseUrl() : this._getApiUrl() ) + endpoint;
		return fetch(url, {headers: {'Authorization': this._getBasicAuthHeader()}, redirect: 'manual'});
	}
	
	getJson(endpoint, isAbsolute) {
		return this.get(endpoint, isAbsolute)
		.then(response => {
			return response.json();
		});
	}
	
	setPassword(password) {
		this.password = password;
	}
}

module.exports = CloudConnectorInstance;