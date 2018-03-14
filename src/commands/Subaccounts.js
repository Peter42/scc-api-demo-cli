/*
 * Commands to list all subaccounts and show details of one subaccount
 */
 
const utils = require('../Utils');

function commandListSubaccounts() {
	return getActiveInstance()
	.then(config => config.getJson('subaccounts', false))
	.then(subaccounts => {
		subaccounts.forEach(subaccount => {
			console.log(`${subaccount.regionHost}/${subaccount.subaccount}`);
		});
	});
}

function commandDetailSubaccount([subaccount]) {
	if(!subaccount) {
		return Promise.reject('Provide Subaccount-name as argument (regionHost/subaccount)');
	}
	
	return getActiveInstance()
	.then(config => {
		return config.getJson('subaccounts/' + subaccount, false)
		.then(data => {
			console.log(`${data.regionHost}/${data.subaccount}`);
			console.log(`\tDisplay Name: ${data.displayName}`);
			console.log(`\tDescription: ${data.description}`);
			console.log(`\tLocation-ID: ${data.locationID}`);
			console.log(`\tTunnel:\n\t\tState: ${data.tunnel.state}\n\t\tConnected Since: ${data.tunnel.connectedSince}\n\t\tUser: ${data.tunnel.user}`);
			return config.getJson(utils.getLinkHref(data, 'systemMappings'), true);
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