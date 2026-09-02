#!/usr/bin/env node
// `cp package*.json dist` (needed so `npm ci` installs the server's own
// dependencies into dist) overwrites dist/package.json's version with
// server/package.json's, which isn't kept in sync with the real release
// version. client-config.ts reads dist/package.json for the footer version,
// so patch it back to the root package.json's version after the copy.
const fs = require('fs')
const path = require('path')

const rootPkgPath = path.join(__dirname, '..', '..', 'package.json')
const distPkgPath = path.join(__dirname, '..', 'dist', 'package.json')

const { version } = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'))
const distPkg = JSON.parse(fs.readFileSync(distPkgPath, 'utf8'))
distPkg.version = version
fs.writeFileSync(distPkgPath, JSON.stringify(distPkg, null, 2) + '\n')
