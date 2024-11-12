/**
 * @file Permission Contract Deployment builder
 *
 * Creates files for starting an instance of the contract:
 * * contract source and instantiation proposal bundles to be published via
 *   `agd tx swingset install-bundle`
 * * start-ed-cert-permit.json and start-ed-cert.js to submit the
 *   instantiation proposal via `agd tx gov submit-proposal swingset-core-eval`
 *
 * Usage:
 *   agoric run build-contract-deployer.js
 */

import { makeHelpers } from '@agoric/deploy-script-support';
import { getManifestForPatientData } from '../src/ed-cert-proposal.js';

/** @type {import('@agoric/deploy-script-support/src/externalTypes.js').ProposalBuilder} */
export const patientDataProposalBuilder = async ({ publishRef, install }) => {
  return harden({
    sourceSpec: '../src/ed-cert-proposal.js',
    getManifestCall: [
      getManifestForPatientData.name,
      {
        patientDataRef: publishRef(
          install(
            '../src/ed-cert-contract.js',
            '../bundles/bundle-ed-cert.js',
            {
              persist: true,
            },
          ),
        ),
      },
    ],
  });
};

/** @type {DeployScriptFunction} */
export default async (homeP, endowments) => {
  const { writeCoreProposal } = await makeHelpers(homeP, endowments);
  await writeCoreProposal('start-ed-cert', patientDataProposalBuilder);
};
