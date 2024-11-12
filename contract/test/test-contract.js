/**
 * @file Test basic data storage using the Med Rec contract.
 */
// @ts-check

/* eslint-disable import/order -- https://github.com/endojs/endo/issues/1235 */
import { test as anyTest } from './prepare-test-env-ava.js';
import { createRequire } from 'module';
import { E } from '@endo/far';
import { makeNodeBundleCache } from '@endo/bundle-source/cache.js';
import { makeZoeKitForTest } from '@agoric/zoe/tools/setup-zoe.js';
import { makeMockChainStorageRoot } from '@agoric/internal/src/storage-test-utils.js';

const myRequire = createRequire(import.meta.url);
const contractPath = myRequire.resolve(`../src/ed-cert-contract.js`);

const test = anyTest;

const makeTestContext = async _t => {
  const { zoeService: zoe } = makeZoeKitForTest();
  const bundleCache = await makeNodeBundleCache('bundles/', {}, s => import(s));
  const bundle = await bundleCache.load(contractPath, 'edCertContract');

  return {
    zoe,
    bundle,
    bundleCache,
    storageNode: makeMockChainStorageRoot().makeChildNode('patientData'),
    board: makeMockChainStorageRoot().makeChildNode('boardAux'),
  };
};

test.before(async t => (t.context = await makeTestContext(t)));

// Test successful patient data publishing
test('Successfully publish valid patient data', async t => {
  const { bundle, zoe, storageNode, board } = t.context;

  const terms = {
    maxPatients: 1000n,
  };

  const installation = await E(zoe).install(bundle);
  const { publicFacet } = await E(zoe).startInstance(
    installation,
    undefined,
    terms,
    { storageNode, board },
  );

  const validPatientData = {
    patientId: 'P12345',
    name: 'John Doe',
    age: 30,
    gender: 'M',
    bloodType: 'O+',
  };

  const invitation = E(publicFacet).makePublishInvitation();

  const userSeat = await E(zoe).offer(invitation, undefined, undefined, {
    patientData: validPatientData,
  });

  const result = await E(userSeat).getOfferResult();
  t.is(result, 'Patient data published successfully');
});

// Test invalid patient data rejection
test('Reject invalid patient data', async t => {
  const { bundle, zoe, storageNode, board } = t.context;

  const terms = {
    maxPatients: 1000n,
  };

  const installation = await E(zoe).install(bundle);
  const { publicFacet } = await E(zoe).startInstance(
    installation,
    undefined,
    terms,
    { storageNode, board },
  );

  const invalidPatientData = {
    patientId: 'P12345',
    name: 'John Doe',
    // Missing required fields: age, gender, bloodType
  };

  const invitation = E(publicFacet).makePublishInvitation();
  const seat = await E(zoe).offer(invitation, undefined, undefined, {
    patientData: invalidPatientData,
  });
  const resultP = await E(seat).getOfferResult();
  t.is(resultP.message, 'Invalid patient data structure');
});

// Test duplicate patient ID handling
test('Handle duplicate patient ID', async t => {
  const { bundle, zoe, storageNode, board } = t.context;

  const terms = {
    maxPatients: 1000n,
  };

  const installation = await E(zoe).install(bundle);
  const { publicFacet } = await E(zoe).startInstance(
    installation,
    undefined,
    terms,
    { storageNode, board },
  );

  const patientData = {
    patientId: 'P12345',
    name: 'John Doe',
    age: 30,
    gender: 'M',
    bloodType: 'O+',
  };

  // First submission
  const invitation1 = E(publicFacet).makePublishInvitation();
  await E(zoe).offer(invitation1, undefined, undefined, { patientData });

  // Second submission with same ID
  const invitation2 = E(publicFacet).makePublishInvitation();
  const duplicateData = { ...patientData, name: 'Jane Doe' };

  const userSeat = await E(zoe).offer(invitation2, undefined, undefined, {
    patientData: duplicateData,
  });

  const result = await E(userSeat).getOfferResult();
  t.is(result, 'Patient data published successfully');
});

// Test maxPatients limit
test('Enforce maxPatients limit', async t => {
  const { bundle, zoe, storageNode, board } = t.context;

  const terms = {
    maxPatients: 1n, // Set limit to 1 patient
  };

  const installation = await E(zoe).install(bundle);
  const { publicFacet } = await E(zoe).startInstance(
    installation,
    undefined,
    terms,
    { storageNode, board },
  );

  const patient1Data = {
    patientId: 'P12345',
    name: 'John Doe',
    age: 30,
    gender: 'M',
    bloodType: 'O+',
  };

  const patient2Data = {
    patientId: 'P67890',
    name: 'Jane Doe',
    age: 25,
    gender: 'F',
    bloodType: 'A+',
  };

  // First patient should succeed
  const invitation1 = E(publicFacet).makePublishInvitation();
  await E(zoe).offer(invitation1, undefined, undefined, {
    patientData: patient1Data,
  });

  // Second patient should fail due to maxPatients limit
  const invitation2 = E(publicFacet).makePublishInvitation();

  const seat = await E(zoe).offer(invitation2, undefined, undefined, {
    patientData: patient2Data,
  });
  const result = await E(seat).getOfferResult();
  t.is(result.message, 'Maximum number of patients reached');
});
