// Copyright 2018 Philipp Stehle
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/*
 * Promise based access to the Cloud Connector API
 */

const fetch = require('node-fetch');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
 
function _getLinkHref(data, name) {
	link = data._links.filter(item => {
		return item.rel === name;
	});
	if(link.length === 0) {
		return null;
	}
	return link[0].href;
}
 
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
	
	_post(endpoint, body, contenttype, isAbsolute) {
		let url = (isAbsolute ? this._getBaseUrl() : this._getApiUrl() ) + endpoint;
		return fetch(url, {method: 'POST', body: body, headers: {'Authorization': this._getBasicAuthHeader(), 'Content-Type': contenttype}, redirect: 'manual'});
	}
	
	_get(endpoint, isAbsolute) {
		let url = (isAbsolute ? this._getBaseUrl() : this._getApiUrl() ) + endpoint;
		return fetch(url, {headers: {'Authorization': this._getBasicAuthHeader()}, redirect: 'manual'});
	}
	
	_getJson(endpoint, isAbsolute) {
		return this._get(endpoint, isAbsolute)
		.then(response => {
			return response.json();
		});
	}
	
	setPassword(password) {
		this.password = password;
	}
	
	// API Methods
	
	getCommonDescription() {
		return this._getJson('connector', false);
	}
	
	getSubaccounts() {
		return this._getJson('subaccounts', false);
	}
	
	getSubaccount(subaccountName) {
		return this._getJson('subaccounts/' + subaccountName, false);
	}
	
	getSubaccountMappings(subaccount) {
		return this._getJson(_getLinkHref(subaccount, 'systemMappings'), true);
	}
	
	createBackup(password) {
		return this._post('backup', JSON.stringify({password: password}), 'application/json', false);
	}
}

module.exports = CloudConnectorInstance;