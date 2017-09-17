import chalk = require('chalk')
import {Log} from 'pnpm-logger'
import commonTags = require('common-tags')
import os = require('os')

const stripIndent = commonTags.stripIndent
const EOL = os.EOL
const highlight = chalk.yellow
const colorPath = chalk.gray

export default function reportError (logObj: Log) {
  if (logObj['err']) {
    const err = <Error & { code: string }>logObj['err']
    switch (err.code) {
      case 'UNEXPECTED_STORE':
        return reportUnexpectedStore(err, logObj['message'])
      case 'STORE_BREAKING_CHANGE':
        return reportStoreBreakingChange(err, logObj['message'])
      case 'MODULES_BREAKING_CHANGE':
        return reportModulesBreakingChange(err, logObj['message'])
      case 'MODIFIED_DEPENDENCY':
        return reportModifiedDependency(err, logObj['message'])
      case 'SHRINKWRAP_BREAKING_CHANGE':
        return reportShrinkwrapBreakingChange(err, logObj['message'])
      default:
        return formatErrorSummary(err.message || logObj['message'])
    }
  }
  return formatErrorSummary(logObj['message'])
}

function reportUnexpectedStore (err: Error, msg: Object) {
  return stripIndent`
    ${formatErrorSummary(err.message)}

    expected: ${highlight(msg['expectedStorePath'])}
    actual: ${highlight(msg['actualStorePath'])}

    If you want to use the new store, run the same command with the ${highlight('--force')} parameter.
  `
}

function reportStoreBreakingChange (err: Error, msg: Object) {
  let output = stripIndent`
    ${formatErrorSummary(`The store used for the current node_modules is incomatible with the current version of pnpm`)}
    Store path: ${colorPath(msg['storePath'])}

    Try running the same command with the ${highlight('--force')} parameter.
  `

  if (msg['additionalInformation']) {
    output += EOL + EOL + msg['additionalInformation']
  }

  output += formatRelatedSources(msg)
  return output
}

function reportModulesBreakingChange (err: Error, msg: Object) {
  let output = stripIndent`
    ${formatErrorSummary(`The current version of pnpm is not compatible with the available node_modules structure`)}
    node_modules path: ${colorPath(msg['modulesPath'])}

    Run ${highlight('pnpm install --force')} to recreate node_modules.
  `

  if (msg['additionalInformation']) {
    output += EOL + EOL + msg['additionalInformation']
  }

  output += formatRelatedSources(msg)
  return output
}

function formatRelatedSources (msg: Object) {
  let output = ''

  if (!msg['relatedIssue'] && !msg['relatedPR']) return output

  output += EOL

  if (msg['relatedIssue']) {
    output += EOL + `Related issue: ${colorPath(`https://github.com/pnpm/pnpm/issues/${msg['relatedIssue']}`)}`
  }

  if (msg['relatedPR']) {
    output += EOL + `Related PR: ${colorPath(`https://github.com/pnpm/pnpm/pull/${msg['relatedPR']}`)}`
  }

  return output
}

function formatErrorSummary (message: string) {
  return `${chalk.bgRed.black('\u2009ERROR\u2009')} ${chalk.red(message)}`
}

function reportModifiedDependency (err: Error, msg: Object) {
  return stripIndent`
    ${formatErrorSummary('Packages in the store have been mutated')}

    These packages are modified:
    ${msg['modified'].map((pkgPath: string) => colorPath(pkgPath)).join(EOL)}

    You can run ${highlight('pnpm install')} to refetch the modified packages
  `
}

function reportShrinkwrapBreakingChange (err: Error, msg: Object) {
  return stripIndent`
    ${formatErrorSummary(err.message)}

    Run with the ${highlight('--force')} parameter to recreate the shrinkwrap file.
  `
}