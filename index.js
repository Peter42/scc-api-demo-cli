#!/usr/bin/env node

const inquirer = require('inquirer');
inquirer.registerPrompt('command', require('inquirer-command-prompt'));
const colors = require('colors');

const Configuration = require('./src/Configuration');
const CloudConnectorInstance = require('./src/CloudConnectorInstance');

const commandsSubaccounts = require('./src/commands/Subaccounts.js');
const commandsBackup = require('./src/commands/Backup.js');

function nextCmd(prompt) {
	return inquirer.prompt([
		{ type: 'command', name: 'cmd', message: prompt, autoCompletion: completer, context: 0 }
	]).then(answers => {
		return Promise.resolve(answers.cmd)
	}).catch(err => {
		console.error(err.stack)
	});
}

function printHelp() {
	console.log("Available commands: ");
	
	let longest = 0;
	for(command in commands) {
		longest = Math.max(longest, command.length);
	}
	let sep = "  ";
	for(var i = 0; i < longest; ++i) {
		sep += " ";
	}
	
	for(command in commands) {
		console.log(`    ${command}${sep.substring(command.length)}${commands[command].help}`);
	}
	
	return Promise.resolve();
}

function commandConfigPrettyprint() {
	return Configuration.load()
	.then(_ => {
		return Configuration.save();
	})
	.then(_ => {
		console.log("Formatted!");
	});
}

function commandConfigAddInstance() {
	return Promise.all([
		Configuration.load(),
		inquirer.prompt([
			{type: 'input', message: 'Instance URL', name: 'url', default: 'https://localhost:8443'},
			{type: 'input', message: 'User', name: 'user', default: 'Administrator' }
		])
	])
	.then(([config, {url, user}]) => {
		config.CloudConnectorInstance.push({
			url: url,
			user: user
		});
		return Configuration.save();
	});
}

function commandCommonDescription() {
	return getActiveInstance()
	.then(instance => instance.getCommonDescription())
	.then(data => {
		let role = "<none>";
		let description = "<none>";
		
		if( data && data.ha && data.ha.role ) {
			role = data.ha.role;
		}
		if( data && data.description ) {
			description = data.description;
		}
		
		console.log(`HA-Role: ${role}\nDescription: ${description}`);
	});
}

function commandSwitchInstance() {
	return Configuration.load().then(config => {
		let instances = config.CloudConnectorInstance;
		if(instances.length === 0) {
			return Promise.reject('No Instance configured. Run config-addinstance first.');
		}
		if(instances.length === 1) {
			setActiveInstance(instances[0]);
			return Promise.reject('Only one instance configured');
		}
		
		const choices = [];
		for(let i = 0; i < instances.length; ++i) {
			choices.push({
				value: i,
				name: instanceToString(instances[i])
			});
		}
		
		return inquirer.prompt([
			{ type: 'list', name: 'instance', choices: choices, message: 'Select Instance' }
		])
		.then(({instance}) => {
			setActiveInstance(instances[instance]);
		});
	});
}


let commands = {
	'help': {
		help: 'Print help info',
		fn: printHelp
	},
	
	'commondescription': {
		help: 'Read Common Description',
		fn: commandCommonDescription
	},
	
	'switchinstance': {
		help: 'Select active instance',
		fn: commandSwitchInstance
	},
	
	'config-prettyprint': {
		help: 'Formats your config file (e.g. after editing it manually)',
		fn: commandConfigPrettyprint
	},
	
	'config-addinstance': {
		help: 'Add a cloud connector instance to your config file',
		fn: commandConfigAddInstance
	}
};
Object.assign(commands, commandsBackup, commandsSubaccounts);

function completer(text) {
	const parts = text.split(/ +/);
	if(parts.length == 1) {
		const suggestions = Object.keys(commands).filter((c) => c.startsWith(text));
		return suggestions;
	}
	return [];
}

let promptMsg = '>';

function instanceToString(instance) {
	let url = instance.url;
	if(url.startsWith("https://")) {
		url = url.substr("https://".length);
	}
	return `${instance.user}@${url}`;
}

let activeInstance = null;
function setActiveInstance(instance) {
	activeInstance = new CloudConnectorInstance(instance);
	promptMsg = `${instanceToString(instance)} >`;
}

function getActiveInstance() {
	return new Promise(function(resolve, reject) {
		if(activeInstance === null) {
			reject('No Cloud Connector Instance configured. Run config-addinstance first.');
			return;
		}
		if(activeInstance.password === null) {
			inquirer.prompt([{type: 'password', message: 'Enter Instance password', name: 'password'}])
			.then(res => {
				activeInstance.setPassword(res.password);
				resolve(activeInstance);
			})
			.catch(reject);
			return;
		}
		resolve(activeInstance);
	});
}
// TODO: is there better way? maybe pass the function as parameter to every command, but refactoring would be needed.
global.getActiveInstance = getActiveInstance;

Configuration.load().then(config => {
	let instances = config.CloudConnectorInstance;
	if(instances.length > 0) {
		setActiveInstance(instances[0]);
	}
	mainloop();
});

console.log('+-------------------------------------------------+'.red.bold.bgWhite);
console.log('| DISCLAIMER:                                     |'.red.bold.bgWhite);
console.log('| This CLI tool is for demo of the SCC API only!  |'.red.bold.bgWhite);
console.log('| NOT READY FOR PRODUCTIVE USE!                   |'.red.bold.bgWhite);
console.log('+-------------------------------------------------+'.red.bold.bgWhite);

function mainloop() {
	nextCmd(promptMsg).then(line => {
		const parts = line.split(/ +/);
		let command = commands[parts[0]];
		if(!command) {
			command = commands['help'];
		}
			
		return command.fn(parts.slice(1));
	})
	.then(mainloop)
	.catch(e => {
		console.error(e);
		mainloop();
	});
}
