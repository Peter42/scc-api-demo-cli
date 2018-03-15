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
 * Uses a Cloud Connector API call to create a backup zip of current configuration
 * TODO: restore
 */ 

const fs = require('fs');
const inquirer = require('inquirer');

function _readBackupPassword() {
	return new Promise(function(resolve, reject) {
		inquirer.prompt([
			{type: 'password', message: 'Select Backup password', name: 'pw1'},
			{type: 'password', message: 'Repeat Backup password', name: 'pw2'}
		])
		.then(({pw1, pw2}) => {
			if(pw1 !== pw2) {
				console.error('Passwords did not match');
				return _readBackupPassword();
			}
			resolve(pw1);
		});
	});
}

function _zeropad(number, length) {
	let str = `${number}`;
	if(str.length < length) {
		return '0'.repeat(length - str.length) + str;
	}
	return str;
}

function _selectBackupLocation() {
	let now = new Date();
	let filename = 'scc_backup_' +
					_zeropad(1900 + now.getYear(), 4) + _zeropad(now.getMonth(), 2) + _zeropad(now.getDate(), 2) + '_' + 
					_zeropad(now.getHours(), 2) + _zeropad(now.getMinutes(), 2) + '.zip';
	return new Promise(function (resolve, reject) {
		fs.stat(filename, function(err, result) {
			if(err) {
				if(err.code == 'ENOENT') {
					resolve(filename);
				}
				else {
					reject(e);
				}
			}
			else {
				reject('Backup file already exits');
			}
		});
	});
}

function commandCreateBackup() {
	return Promise.all([getActiveInstance(), _selectBackupLocation()])
	.then(([instance, backupLocation]) => {
		return _readBackupPassword()
		.then(password => {
			return instance.createBackup(password);
		})
		.then(res => {
			return new Promise(function(resolve, reject) {
				let filestream = fs.createWriteStream(backupLocation);
				res.body.pipe(filestream);
				res.body.on('end', _ => {
					console.log(`Backup written to ${backupLocation}`);
					resolve();
				});
				res.body.on('error', reject);
			});
		});
	});
}


module.exports = {
	'backup-create': {
		help: 'Create a Backup of the current Cloud Connector Configuration',
		fn: commandCreateBackup
	}
};