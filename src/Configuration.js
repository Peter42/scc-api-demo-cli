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
 * This class is not interesting, just some JSON I/O stuff
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const configfile = path.join(os.homedir(), 'scc_cli.json');

class Configuration{}
Configuration._data = null;
Configuration._getDefaultConfig = function() {
	return {
		"CloudConnectorInstance": []
	};
};
Configuration.load = function(forceReload) {
	if(Configuration._data === null || forceReload) {
		return new Promise(function(resolve, reject) {
			fs.readFile(configfile, 'utf8', function (err, data) {
				if (err) {
					if(err.code === 'ENOENT') {
						resolve(Configuration._getDefaultConfig());
					}
					else {
						reject(err);
					}
				}
				else {
					resolve(JSON.parse(data));
				}
			});
		})
		.then(config => {
			this._data = config;
			return config;
		});
	}
	else {
		return Promise.resolve(Configuration._data);
	}
};

Configuration.save = function() {
	return new Promise(function(resolve, reject) {
		fs.writeFile(configfile, JSON.stringify(Configuration._data, undefined, 4), 'utf8', function(err) {
			if (err) {
				reject(err);
			}
			else {
				resolve();
			}
		});
	});
};

module.exports = Configuration;