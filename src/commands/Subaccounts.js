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
 * Commands to list all subaccounts and show details of one subaccount
 */

function commandListSubaccounts() {
	return getActiveInstance()
	.then(instance => instance.getSubaccounts())
	.then(subaccounts => {
		subaccounts.forEach(subaccount => {
			console.log(`${subaccount.regionHost}/${subaccount.subaccount}`);
		});
	});
}

function commandDetailSubaccount([subaccountName]) {
	if(!subaccountName) {
		return Promise.reject('Provide Subaccount-name as argument (regionHost/subaccount)');
	}
	
	return getActiveInstance()
	.then(instance => {
		return instance.getSubaccount(subaccountName)
		.then(subaccount => {
			console.log(`${subaccount.regionHost}/${subaccount.subaccount}`);
			console.log(`\tDisplay Name: ${subaccount.displayName}`);
			console.log(`\tDescription: ${subaccount.description}`);
			console.log(`\tLocation-ID: ${subaccount.locationID}`);
			console.log(`\tTunnel:\n\t\tState: ${subaccount.tunnel.state}\n\t\tConnected Since: ${subaccount.tunnel.connectedSince}\n\t\tUser: ${subaccount.tunnel.user}`);
			return instance.getSubaccountMappings(subaccount);
		})
		.then(mappings => {
			console.log('\tMappings:');
			mappings.forEach(mapping => {
				console.log(`\t\t${mapping.virtualHost}:${mapping.virtualPort} ---${mapping.protocol}--->  ${mapping.localHost}:${mapping.localPort}`);
			});
		});
		
	});
}

module.exports = {
	'subaccounts-list': {
		help: 'List Subaccounts',
		fn: commandListSubaccounts
	},
	
	'subaccounts-details': {
		help: 'Print detailed information about a Subaccount',
		fn: commandDetailSubaccount
	}
};