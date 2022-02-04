#!/usr/bin/env node
var Registry = require('./lib/Registry.js')
var os = require('os')

console.log('Starting')

var ifaces = os.networkInterfaces()

if (process.argv.length > 2 && process.argv[2].substr(0, 1) == '-') {
	console.error('Usage: ./headless.js [device] [port]')
	console.error('')
	console.error('Available Interfaces:')

	Object.keys(ifaces).forEach(function (ifname) {
		ifaces[ifname].forEach(function (iface) {
			if ('IPv4' !== iface.family) {
				// skip over non-ipv4 addresses for now
				return
			}
			console.error(ifname, iface.address)
		})
	})

	console.error('')
	console.error('Example: ./headless.js eth0')
	process.exit(1)
} else if (process.argv.length < 3) {
	Object.keys(ifaces).forEach(function (ifname) {
		ifaces[ifname].find(function (iface) {
			if ('IPv4' === iface.family && iface.internal) {
				process.argv.push(ifname)
				console.error('Starting headless with interface "' + ifname + '"')
				return true
			}
			return false
		})
	})
}

let configDir
if (process.env.COMPANION_CONFIG_BASEDIR !== undefined) {
	configDir = process.env.COMPANION_CONFIG_BASEDIR
} else {
	configDir = process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']
}

;(async () => {
	const registry = await Registry.create(configDir)

	var port = '8000'

	if (process.argv[3] != null) {
		port = process.argv[3]
	}

	if (process.argv[2] === 'list') {
		console.log('Found interfaces:')
		for (var k in ifaces) {
			console.log(k)
		}
		process.exit(0)
	}

	if (process.argv[2] in ifaces) {
		var address
		var iface = ifaces[process.argv[2]]

		iface.forEach(function (ipv) {
			if ('IPv4' !== ipv.family) {
				// skip over non-ipv4 addresses for now
				return
			}
			address = ipv.address
		})

		setTimeout(function () {
			registry.ready(address, port, !process.env.DEVELOPER)
			console.log('Started')
		}, 1000)
	} else if (process.argv[2] == '0.0.0.0') {
		setTimeout(function () {
			registry.ready('0.0.0.0', port, !process.env.DEVELOPER)
			console.log('Started')
		}, 1000)
	} else {
		console.log('Interface not found!')
		process.exit(1)
	}
})()
